// jobs.service — lógica de negocio: fetch de vacante (SSRF-safe), búsqueda
// multi-provider con filtro IA, y compatibilidad CV vs vacante (con cache).
const { isAllowedJobUrl } = require('./jobs.ssrf');
const {
  limpiarDescripcionVacante, filtrarVacantesIndices, analizarCompatibilidadVacante,
  isProviderReady, TASKS,
} = require('../../platform/ai');
const providers = require('./jobs.providers');
const repo = require('./jobs.repository');

// Errores de dominio (el controller los mapea a HTTP con su status).
class DomainError extends Error { constructor(message, status, extra = {}) { super(message); this.status = status; Object.assign(this, extra); } }

const generarJobKey = (title, company) =>
  `${(title || '').toLowerCase().trim()}|${(company || '').toLowerCase().trim()}`;

// ── fetch-url: descarga y limpia una página de vacante (anti-SSRF) ──
async function fetchJobUrl(url) {
  if (!url || !isAllowedJobUrl(url)) {
    throw new DomainError('URL inválida o dominio no permitido. Por favor pega la descripción manualmente.', 400);
  }

  const response = await fetch(url, {
    redirect: 'manual', // anti-SSRF: no seguir redirects a IPs internas/metadata
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
    },
  });

  if (response.status >= 300 && response.status < 400) {
    throw new DomainError('La URL redirige a otra página. Por favor pega la descripción manualmente.', 400);
  }
  if (!response.ok) {
    let hostname = '';
    try { hostname = new URL(url).hostname.replace(/^www\./, ''); } catch { /* noop */ }
    if ([401, 403, 429].includes(response.status)) {
      throw new DomainError(`El sitio${hostname ? ` ${hostname}` : ''} bloqueó la lectura automática. Copia y pega la descripción manualmente.`, response.status);
    }
    if (response.status === 404) {
      throw new DomainError(`La vacante ya no está disponible${hostname ? ` en ${hostname}` : ''} (404). Pega la descripción manualmente.`, 404);
    }
    throw new DomainError(`No pudimos leer la vacante (Error ${response.status}). Pega la descripción manualmente.`, 400);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || (!contentType.includes('text/html') && !contentType.includes('text/plain'))) {
    throw new DomainError('La URL no devuelve HTML válido. Pega la descripción manualmente.', 400);
  }
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    throw new DomainError('La página es demasiado grande. Pega la descripción manualmente.', 413);
  }

  const html = await response.text();
  const texto = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, '\n').trim();

  const textoRecortado = texto.length > 12000 ? texto.slice(0, 12000) : texto;

  if (!isProviderReady(TASKS.JOBS_CLEAN)) return { text: textoRecortado };
  return { text: await limpiarDescripcionVacante(textoRecortado) };
}

// ── similar: búsqueda multi-provider con dedup, post-filtro geo y filtro IA ──
function dedupe(vacantes) {
  const vistos = new Set();
  return vacantes.filter(v => {
    const key = `${v.title?.toLowerCase().trim()}|${v.company?.toLowerCase().trim()}`;
    if (vistos.has(key)) return false;
    vistos.add(key);
    return true;
  });
}

async function findSimilar(query) {
  const { keywords, title, location, datecreated, employment_type, experience, radius, salary, page, companies = [] } = query;
  const queryOriginal = (keywords || title || '').trim();
  if (!queryOriginal) throw new DomainError('Se requiere el cargo o palabras clave', 400);

  const modoEmpresas = companies.length > 0;

  if (modoEmpresas) {
    const searchPromises = companies.flatMap(empresa => [
      providers.searchJooble({ title: `${queryOriginal} ${empresa}`, location, datecreated, employment_type, experience, radius, salary, page }),
      providers.searchGoogleJobs({ title: `${queryOriginal} at ${empresa}`, location, datecreated }),
      providers.searchAdzuna({ title: `${queryOriginal} ${empresa}`, location, datecreated, employment_type }),
      providers.searchJSearch({ title: `${queryOriginal} ${empresa}`, location, employment_type }),
    ]);
    const flat = (await Promise.all(searchPromises)).flat();
    let resultados = dedupe(flat);
    const gl = providers.detectarGL(location);
    if (gl !== 'us' && location) {
      const sinUSA = resultados.filter(v => !providers.esResultadoUSA(v));
      if (sinUSA.length > 0) resultados = sinUSA;
    }
    const norm = s => (s || '').toLowerCase().trim();
    const enObjetivo = v => companies.some(e => norm(v.company).includes(norm(e)));
    resultados.sort((a, b) => (enObjetivo(b) ? 1 : 0) - (enObjetivo(a) ? 1 : 0));
    return { vacantes: resultados, total: resultados.length, modoEmpresas: true };
  }

  const esRemoto = /remot|remote/i.test(location || '') || /remot|remote/i.test(queryOriginal);
  const results = await Promise.all([
    providers.searchJooble({ title: queryOriginal, location, datecreated, employment_type, experience, radius, salary, page }),
    providers.searchGoogleJobs({ title: queryOriginal, location, datecreated }),
    providers.searchAdzuna({ title: queryOriginal, location, datecreated, employment_type }),
    providers.searchJSearch({ title: queryOriginal, location, employment_type }),
    esRemoto ? providers.searchRemotive({ title: queryOriginal }) : Promise.resolve([]),
  ]);
  let vacantes = dedupe(results.flat());
  if (vacantes.length === 0) return { vacantes: [], total: 0 };

  if (!isProviderReady(TASKS.JOBS_FILTER)) return { vacantes, total: vacantes.length, sinFiltroIA: true };

  const gl = providers.detectarGL(location);
  if (gl !== 'us' && location) {
    const filtrados = vacantes.filter(v => !providers.esResultadoUSA(v));
    if (filtrados.length > 0) vacantes = filtrados;
  }

  // Filtro IA: relevancia de cargo + ubicación
  const ubicacionCtx = location || 'LATAM';
  const lista = vacantes.map((v, i) => `${i}. ${v.title} | ${v.company || ''} | ${v.location || ''}`).join('\n');
  try {
    const indices = await filtrarVacantesIndices({ queryOriginal, ubicacionCtx, lista });
    if (indices.size > 0) vacantes = vacantes.filter((_, i) => indices.has(i));
  } catch (e) {
    console.warn('[jobs.service] filtro IA falló:', e.message);
  }
  return { vacantes, total: vacantes.length };
}

// ── compatibility: score CV vs vacante (con cache, Claude por PII) ──
async function checkCompatibility(db, userId, body) {
  const { cvText, jobTitle, jobCompany, jobSnippet, jobLink, jobLocation, jobVia } = body;
  if (cvText.length > 50000) throw new DomainError('El CV es demasiado largo para analizar', 413, { maxChars: 50000 });
  if ((jobSnippet || '').length > 10000) throw new DomainError('La descripción de la vacante es demasiado larga', 413, { maxChars: 10000 });

  const jobKey = generarJobKey(jobTitle, jobCompany);

  const cached = await repo.getCachedCheck(db, jobKey);
  if (cached) return { score: cached.score, motivos: cached.motivos, fromCache: true };

  if (!isProviderReady(TASKS.JOBS_COMPAT)) throw new DomainError('Servicio de análisis no disponible temporalmente', 503);

  const { score, motivos } = await analizarCompatibilidadVacante({ cvText, jobTitle, jobSnippet });

  const jobData = { title: jobTitle, company: jobCompany || '', location: jobLocation || '', link: jobLink || '', via: jobVia || '', snippet: jobSnippet || '' };
  await repo.saveCheck(db, userId, { jobKey, score, motivos, jobData });

  return { score, motivos, fromCache: false };
}

module.exports = { fetchJobUrl, findSimilar, checkCompatibility, generarJobKey, DomainError };
