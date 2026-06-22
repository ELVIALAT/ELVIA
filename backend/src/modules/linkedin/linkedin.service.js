// linkedin.service — lógica de negocio. No conoce HTTP; usa el repository.
const { analizarLinkedin, extraerDatosLinkedin } = require('../../services/deepseekService');
const { extraerTextoPDF } = require('../../utils/pdfParser');
const repo = require('./linkedin.repository');

const LIMITE_ANALISIS_MES = 10;

// Errores de dominio (el controller los mapea a HTTP).
class ValidationError extends Error { constructor(m) { super(m); this.code = 'VALIDATION'; } }
class MonthlyLimitError extends Error {
  constructor(usados) { super('límite mensual alcanzado'); this.code = 'MONTHLY_LIMIT'; this.usados = usados; }
}
class IdentityMismatchError extends Error { constructor(m) { super(m); this.code = 'IDENTITY_MISMATCH'; } }

function fechaResetMes() {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1).toISOString();
}

// Extrae titular/resumen del CV optimizado (tolerante a formas históricas).
function extraerTitularDeCV(cvRow) {
  if (!cvRow?.contenido) return '';
  try {
    const c = typeof cvRow.contenido === 'string' ? JSON.parse(cvRow.contenido) : cvRow.contenido;
    return c?.cargo_objetivo || c?.titular || c?.headline || '';
  } catch { return ''; }
}
function extraerResumenDeCV(cvRow) {
  if (!cvRow?.contenido) return '';
  try {
    const c = typeof cvRow.contenido === 'string' ? JSON.parse(cvRow.contenido) : cvRow.contenido;
    return c?.resumen || c?.extracto || c?.about || '';
  } catch { return ''; }
}

async function getUsoMes(db, userId) {
  const usados = db && userId ? await repo.countAnalysesThisMonth(db, userId) : 0;
  return {
    usados,
    restantes: Math.max(0, LIMITE_ANALISIS_MES - usados),
    limite: LIMITE_ANALISIS_MES,
    fecha_reset: fechaResetMes(),
  };
}

// Construye el contexto de enriquecimiento (Gerente + CV). Best-effort: nunca lanza.
async function buildEnrichment(db, userId) {
  if (!db || !userId) return { gerenteContext: null, cvOptimo: null };
  try {
    const jp = await repo.getJobSearchProfile(db, userId);
    const auto = jp.autoconocimiento || {};
    const oferta = jp.oferta || {};
    const gerenteContext = {
      oferta_valor: oferta.oferta_valor || '',
      hard_skills: Array.isArray(auto.hard_skills) ? auto.hard_skills : [],
      // BD mantiene "soft_skills" aunque la UI muestra "Power Skills" (decisión documentada).
      soft_skills: Array.isArray(auto.soft_skills) ? auto.soft_skills : [],
    };

    const cvRows = await repo.getRecentCvs(db, userId, 10);
    const cvRow = cvRows.find(r => {
      let meta = r.metadata;
      if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch { meta = null; } }
      const subtipo = meta?.subtipo;
      return subtipo !== 'infografia_proyecto' && subtipo !== 'linkedin_analysis';
    });
    const cvOptimo = cvRow
      ? { titular: extraerTitularDeCV(cvRow), extracto: extraerResumenDeCV(cvRow) }
      : null;

    return { gerenteContext, cvOptimo };
  } catch (e) {
    console.warn('[linkedin.service] enriquecimiento opcional falló:', e.message);
    return { gerenteContext: null, cvOptimo: null };
  }
}

// Analiza el perfil LinkedIn. Lanza errores de dominio si procede.
async function analizarPerfil(db, userId, body) {
  const { titular, extracto, experiencia, habilidades, idiomas, educacion, contextoLaboral } = body;
  const campos = { titular, extracto, experiencia, habilidades, idiomas, educacion };

  const recibidos = Object.values(campos).filter(v => v && v.trim().length > 0);
  if (recibidos.length === 0) {
    throw new ValidationError('Debes completar al menos una sección del perfil');
  }

  if (db && userId) {
    const usados = await repo.countAnalysesThisMonth(db, userId);
    if (usados >= LIMITE_ANALISIS_MES) throw new MonthlyLimitError(usados);
  }

  const { gerenteContext, cvOptimo } = await buildEnrichment(db, userId);

  const resultado = await analizarLinkedin({
    titular, extracto, experiencia, habilidades, idiomas, educacion,
    contextoLaboral, gerenteContext, cvOptimo,
  });

  // Persistir para historial (best-effort)
  if (db && userId) {
    const camposUsados = Object.entries(campos)
      .filter(([, v]) => v && v.trim().length > 0)
      .map(([k]) => k);
    repo.insertAnalysis(db, userId, {
      puntaje_global: resultado.puntaje_global,
      resumen_global: resultado.resumen_global,
      top_acciones: resultado.top_acciones,
      secciones: resultado.secciones,
      campos_analizados: camposUsados,
    });
  }

  return resultado;
}

// Extrae datos estructurados de un PDF de LinkedIn, validando identidad.
async function extraerPerfilPDF(db, userId, fileBuffer) {
  if (!fileBuffer) throw new ValidationError('No se subió ningún archivo');

  const rawText = await extraerTextoPDF(fileBuffer);

  if (db && userId) {
    const profile = await repo.getUserName(db, userId);
    if (profile) {
      const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
      const txt = norm(rawText);
      const primerNombre = norm(profile.nombre1).split(' ')[0];
      const primerApellido = norm(profile.apellido1).split(' ')[0];
      const faltaNombre = primerNombre && !txt.includes(primerNombre);
      const faltaApellido = primerApellido && !txt.includes(primerApellido);
      if (faltaNombre || faltaApellido) {
        throw new IdentityMismatchError(
          'Este perfil de LinkedIn no coincide con tu información de registro. Asegúrate de descargar TU propio PDF: entra a tu perfil principal, haz clic en "Recursos" y selecciona "Guardar en PDF".'
        );
      }
    }
  }

  return extraerDatosLinkedin(rawText);
}

async function getHistorial(db, userId) {
  return repo.getHistory(db, userId, 10);
}

async function getUltimoAnalisis(db, userId) {
  if (!db || !userId) return { analisis: null };
  const data = await repo.getLatestReport(db, userId);
  if (!data) return { analisis: null };
  let payload = {};
  try { payload = typeof data.contenido === 'string' ? JSON.parse(data.contenido) : (data.contenido || {}); } catch { /* vacío */ }
  return {
    id: data.id,
    created_at: data.created_at,
    analisis: payload.analisis || null,
    editables: payload.editables || null,
    original: payload.original || null,
  };
}

async function guardarReporte(db, userId, body) {
  const { analisis, editables, original, filename } = body || {};
  if (!analisis || typeof analisis !== 'object') {
    throw new ValidationError('Falta el análisis a guardar');
  }
  const contenido = JSON.stringify({
    analisis, editables: editables || null, original: original || null, version: 'linkedin_pro_v2',
  });
  const metadata = {
    filename: filename || `Analisis LinkedIn ${new Date().toISOString().slice(0, 10)}`,
    frontend_pdf: true,
    subtipo: 'linkedin_analysis',
    puntaje_global: analisis.puntaje_global ?? null,
  };
  const id = await repo.replaceReport(db, userId, { contenido, metadata });
  return { id, ok: true };
}

module.exports = {
  LIMITE_ANALISIS_MES,
  fechaResetMes,
  getUsoMes,
  analizarPerfil,
  extraerPerfilPDF,
  getHistorial,
  getUltimoAnalisis,
  guardarReporte,
  ValidationError,
  MonthlyLimitError,
  IdentityMismatchError,
};
