// Primitiva central del router de IA: resuelve provider+model por política, ejecuta y registra costo.
// Devuelve el TEXTO crudo del modelo — el parseo/retry/fallback vive en cada task (fiel al original).
const { resolve } = require('./policy');
const { recordCost } = require('./cost/ledger');

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
  recordCost({ tenant, task, provider, model, usage });
  if (process.env.AI_LOG_TIMING === '1') {
    console.log(`[ai] ${task} via ${provider}/${model} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  return text;
}

module.exports = { complete };
