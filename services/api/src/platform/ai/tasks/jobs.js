// Tasks del módulo jobs. Prompts/parsing portados verbatim desde jobs.service (que usaba
// jobs.ai, una integración DeepSeek/Claude paralela al router). Ahora pasan por el router:
// clean/filter → DeepSeek (sin PII); compatibilidad → Claude Haiku (cvText = PII, lock).
//
// Estas funciones son PURAS (llamada + parseo); el gate de disponibilidad y los try/catch de
// degradación viven en jobs.service (fiel al control de flujo original, que usaba la presencia
// del cliente como señal). El costo se atribuye por tenant vía AsyncLocalStorage.
const { complete } = require('../complete');
const { TASKS } = require('../policy');

// Limpia el texto scrapeado de una página de vacante → deja solo la descripción.
async function limpiarDescripcionVacante(textoRecortado, ctx = {}) {
  const out = await complete({
    task: TASKS.JOBS_CLEAN,
    messages: [{ role: 'user', content: `Del siguiente texto extraído de una página web de empleo, extrae ÚNICAMENTE la descripción de la vacante: título, empresa, ubicación, rol, requisitos y beneficios. Elimina navegación, menús, empleos similares y publicidad. Responde solo con el texto limpio.\n\nTEXTO:\n${textoRecortado}` }],
    maxTokens: 1024,
    tenant: ctx.tenant,
  });
  return out.trim();
}

// Filtra una lista de vacantes por relevancia de cargo + ubicación. Devuelve un Set de índices.
async function filtrarVacantesIndices({ queryOriginal, ubicacionCtx, lista }, ctx = {}) {
  const out = await complete({
    task: TASKS.JOBS_FILTER,
    messages: [{ role: 'user', content: `Se buscó con: "${queryOriginal}", ubicación: "${ubicacionCtx}". De esta lista devuelve los índices de vacantes relacionadas y compatibles con esa ubicación. Responde solo con los índices separados por comas.\n\n${lista}` }],
    maxTokens: 512,
    tenant: ctx.tenant,
  });
  return new Set(out.trim().split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)));
}

// Compatibilidad CV vs vacante (Claude Haiku, PII-lock). Devuelve { score, motivos }.
async function analizarCompatibilidadVacante({ cvText, jobTitle, jobSnippet }, ctx = {}) {
  const texto = (await complete({
    task: TASKS.JOBS_COMPAT,
    messages: [{ role: 'user', content: `Analiza la compatibilidad entre este CV y la vacante. Responde ÚNICAMENTE en este formato exacto:\n\nSCORE: [número 0-100]\nMOTIVOS:\n- [motivo breve en español]\n- [motivo breve en español]\n- [motivo breve en español]\n\nCV:\n${cvText.slice(0, 2000)}\n\nVACANTE: ${jobTitle}\n${jobSnippet || ''}` }],
    maxTokens: 300,
    tenant: ctx.tenant,
  })).trim();

  const scoreMatch = texto.match(/SCORE:\s*(\d+)/i);
  const motivosMatch = texto.match(/MOTIVOS:\s*([\s\S]+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
  const motivos = motivosMatch
    ? motivosMatch[1].trim().split('\n').map(l => l.replace(/^[-•]\s*/, '').trim()).filter(Boolean)
    : [];
  return { score, motivos };
}

module.exports = { limpiarDescripcionVacante, filtrarVacantesIndices, analizarCompatibilidadVacante };
