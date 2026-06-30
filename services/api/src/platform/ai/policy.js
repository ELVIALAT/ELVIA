// Tabla de política de routing de IA — fuente única de verdad de qué provider/modelo
// atiende cada tarea y qué tareas están bloqueadas a Claude por PII.
//
// Estrategia de aterrizaje = HÍBRIDO POR PII:
//   - piiLock:true  → SIEMPRE Claude (CV crudo / extracción de contacto). Nunca DeepSeek, ni por config.
//   - piiLock:false → provider configurable (DeepSeek hoy = comportamiento actual de prod).
//
// claudeModel = tier a usar CUANDO corre en Claude ('sonnet' premium | 'haiku' extracción/chat).
//
// CÓMO FLIPEAR el bulk no-PII a Claude (sin tocar código):
//   - Global:    AI_NONPII_PROVIDER=claude
//   - Por tarea: agregar `provider: 'claude'` a la fila correspondiente.

const MODELS = {
  sonnet: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
  haiku: process.env.CLAUDE_MODEL_FAST || 'claude-haiku-4-5-20251001',
};
const MODEL_DEEPSEEK = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const NONPII_PROVIDER = process.env.AI_NONPII_PROVIDER || 'deepseek';

const TASKS = {
  CV_OPTIMIZE: 'cv.optimize',
  CV_MATCH: 'cv.match',
  CV_CARTA: 'cv.carta',
  CV_RESUMEN_OPTIMIZAR: 'cv.resumen.optimizar',
  CV_RESUMEN_FUSIONAR: 'cv.resumen.fusionar',
  CV_DESCRIPCION_EXP: 'cv.descripcionExp',
  CV_CORREGIR_PROYECTO: 'cv.corregirProyecto',
  CV_INFOGRAFIA: 'cv.infografia',
  CV_EXTRACT_PROFILE: 'cv.extractProfile',
  INTERVIEW_PREGUNTAS: 'interview.preguntas',
  INTERVIEW_EVALUAR: 'interview.evaluar',
  LINKEDIN_ANALIZAR: 'linkedin.analizar',
  LINKEDIN_EXTRAER: 'linkedin.extraer',
  MENTOR_CHAT: 'mentor.chat',
};

// piiLock=true → Claude-lock (privacidad). claudeModel = tier en Claude.
const POLICY = {
  // ── PREMIUM con PII (CV crudo) → Sonnet, Claude-lock ──────────────────────
  [TASKS.CV_OPTIMIZE]:          { claudeModel: 'sonnet', piiLock: true },
  [TASKS.CV_MATCH]:             { claudeModel: 'sonnet', piiLock: true },
  [TASKS.CV_CARTA]:             { claudeModel: 'sonnet', piiLock: true },
  // ── EXTRACCIÓN con PII (CV crudo / extrae contacto) → Haiku, Claude-lock ──
  [TASKS.CV_INFOGRAFIA]:        { claudeModel: 'haiku',  piiLock: true },
  [TASKS.CV_EXTRACT_PROFILE]:   { claudeModel: 'haiku',  piiLock: true },
  [TASKS.LINKEDIN_EXTRAER]:     { claudeModel: 'haiku',  piiLock: true },
  [TASKS.INTERVIEW_PREGUNTAS]:  { claudeModel: 'haiku',  piiLock: true }, // lleva cv_base (CV crudo)
  // ── PREMIUM sin PII → Sonnet (tier objetivo), DeepSeek en aterrizaje ──────
  [TASKS.CV_RESUMEN_OPTIMIZAR]: { claudeModel: 'sonnet', piiLock: false },
  [TASKS.CV_RESUMEN_FUSIONAR]:  { claudeModel: 'sonnet', piiLock: false },
  [TASKS.LINKEDIN_ANALIZAR]:    { claudeModel: 'sonnet', piiLock: false },
  [TASKS.INTERVIEW_EVALUAR]:    { claudeModel: 'sonnet', piiLock: false },
  // ── BULK / CHAT sin PII → Haiku (tier objetivo), DeepSeek en aterrizaje ───
  [TASKS.CV_DESCRIPCION_EXP]:   { claudeModel: 'haiku',  piiLock: false },
  [TASKS.CV_CORREGIR_PROYECTO]: { claudeModel: 'haiku',  piiLock: false },
  [TASKS.MENTOR_CHAT]:          { claudeModel: 'haiku',  piiLock: false },
};

// Resuelve provider + modelo para una tarea. Aplica el lock de PII de forma estructural:
// una tarea piiLock jamás puede salir a un provider que no sea Claude, ni por env ni por tabla.
function resolve(task) {
  const p = POLICY[task];
  if (!p) throw new Error(`[ai] task desconocida: ${task}`);
  const provider = p.piiLock ? 'claude' : (p.provider || NONPII_PROVIDER);
  const model = provider === 'claude' ? MODELS[p.claudeModel] : MODEL_DEEPSEEK;
  return { provider, model, piiLock: !!p.piiLock };
}

module.exports = { TASKS, POLICY, MODELS, MODEL_DEEPSEEK, resolve };
