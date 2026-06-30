// Router de IA de ELVIA — punto de entrada de platform/ai.
//
// Dos APIs:
//   1. Named exports (optimizeCV, matchCVtoJob, ...) — API tipada, la que usan los facades de services/.
//   2. routeTask({ task, payload, tenant }) — dispatcher genérico del diseño, mapea cada task a su firma.
//
// El routing real (provider/modelo por tarea, PII-lock, costo por tenant) vive en policy.js + complete.js.
const tasks = require('./tasks');
const { complete } = require('./complete');
const { TASKS, resolve } = require('./policy');

const DISPATCH = {
  [TASKS.CV_OPTIMIZE]:          (p, ctx) => tasks.optimizeCV(p.cvText, p.language, p.verifiedProfile, ctx),
  [TASKS.CV_MATCH]:             (p, ctx) => tasks.matchCVtoJob(p.cvText, p.jobText, p.language, p.verifiedProfile, p.contextoUbicacion, ctx),
  [TASKS.CV_CARTA]:             (p, ctx) => tasks.generarCarta(p, ctx),
  [TASKS.CV_RESUMEN_OPTIMIZAR]: (p, ctx) => tasks.optimizarResumen(p.texto, p.idioma, p.contextoGerente, ctx),
  [TASKS.CV_RESUMEN_FUSIONAR]:  (p, ctx) => tasks.fusionarResumen(p.cvResumen, p.ofertaValor, p.idioma, ctx),
  [TASKS.CV_DESCRIPCION_EXP]:   (p, ctx) => tasks.optimizarDescripcionExp(p, ctx),
  [TASKS.CV_CORREGIR_PROYECTO]: (p, ctx) => tasks.corregirProyectoLaboral(p.proyectoData, ctx),
  [TASKS.CV_INFOGRAFIA]:        (p, ctx) => tasks.extraerDatosInfografia(p.cvText, ctx),
  [TASKS.CV_EXTRACT_PROFILE]:   (p, ctx) => tasks.extractProfileFromCV(p.cvText, ctx),
  [TASKS.INTERVIEW_PREGUNTAS]:  (p, ctx) => tasks.generarPreguntasEntrevista(p, ctx),
  [TASKS.INTERVIEW_EVALUAR]:    (p, ctx) => tasks.evaluarEntrevista(p, ctx),
  [TASKS.LINKEDIN_ANALIZAR]:    (p, ctx) => tasks.analizarLinkedin(p, ctx),
  [TASKS.LINKEDIN_EXTRAER]:     (p, ctx) => tasks.extraerDatosLinkedin(p.rawText, ctx),
  [TASKS.MENTOR_CHAT]:          (p, ctx) => tasks.generateChatResponse(p.message, p.history, p.context, ctx),
};

function routeTask({ task, payload = {}, tenant } = {}) {
  const fn = DISPATCH[task];
  if (!fn) throw new Error(`[ai] routeTask: task desconocida: ${task}`);
  return fn(payload, { tenant });
}

module.exports = { ...tasks, routeTask, complete, resolve, TASKS };
