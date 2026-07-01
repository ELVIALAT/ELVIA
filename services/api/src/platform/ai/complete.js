// Primitiva central del router de IA: resuelve provider+model por política, ejecuta y registra costo.
// Devuelve el TEXTO crudo del modelo — el parseo/retry/fallback vive en cada task (fiel al original).
const { resolve } = require('./policy');
const { recordCost } = require('./cost/ledger');
const { getAiContext } = require('./context');

const PROVIDERS = {
  claude: require('./providers/claude'),
  deepseek: require('./providers/deepseek'),
};

async function complete({ task, system, messages, maxTokens, temperature, cacheSystem, tenant }) {
  const { provider, model } = resolve(task);
  const impl = PROVIDERS[provider];
  if (!impl) throw new Error(`[ai] provider desconocido: ${provider}`);

  const t0 = Date.now();
  const { text, usage } = await impl.call({ model, system, messages, maxTokens, temperature, cacheSystem });

  // Atribución de costo: tenant explícito gana; si no, el del request (AsyncLocalStorage).
  const aiCtx = getAiContext();
  recordCost({ tenant: tenant || aiCtx.tenant || null, userId: aiCtx.userId || null, task, provider, model, usage });

  if (process.env.AI_LOG_TIMING === '1') {
    console.log(`[ai] ${task} via ${provider}/${model} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  return text;
}

// ¿El provider que atendería esta task está configurado (API key presente)?
// Para consumidores que gatean su control de flujo por disponibilidad de IA (ej. jobs.service).
function isReady(task) {
  const { provider } = resolve(task);
  const impl = PROVIDERS[provider];
  return !!(impl && impl.isReady && impl.isReady());
}

module.exports = { complete, isReady };
