// Ledger de costo de IA por tenant.
// Persiste el uso de tokens de cada llamada en la tabla `ai_usage` (atribuido al company_id
// del usuario). El costo en USD NO se guarda: se computa al leer con cost/rates.js, así
// actualizar tarifas no requiere migrar datos.
//
// INVARIANTE: el registro de costo NUNCA bloquea ni rompe una llamada de IA.
// La persistencia es fire-and-forget y traga todos sus errores.
const { supabaseAdmin } = require('../../../lib/supabase');
const { estimateCost } = require('./rates');

// Normaliza el usage crudo de cada provider a { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens }.
function normalizeUsage(provider, model, raw) {
  const base = { provider, model, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
  if (!raw) return base;
  if (provider === 'claude') {
    return {
      ...base,
      inputTokens: raw.input_tokens || 0,
      outputTokens: raw.output_tokens || 0,
      cacheReadTokens: raw.cache_read_input_tokens || 0,
      cacheWriteTokens: raw.cache_creation_input_tokens || 0,
    };
  }
  // deepseek (API compatible OpenAI): prompt_cache_hit_tokens / prompt_cache_miss_tokens
  return {
    ...base,
    inputTokens: raw.prompt_tokens || 0,
    outputTokens: raw.completion_tokens || 0,
    cacheReadTokens: raw.prompt_cache_hit_tokens || 0,
    cacheWriteTokens: 0,
  };
}

// Cache userId → company_id (TTL corto) para no consultar `profiles` en cada llamada.
const _companyCache = new Map();
const _CACHE_TTL_MS = 5 * 60 * 1000;

async function resolveCompany(userId) {
  if (!userId || !supabaseAdmin) return null;
  const now = Date.now();
  const hit = _companyCache.get(userId);
  if (hit && hit.exp > now) return hit.companyId;
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();
  const companyId = data?.company_id || null;
  _companyCache.set(userId, { companyId, exp: now + _CACHE_TTL_MS });
  return companyId;
}

// Inserta una fila de uso. Async, no se await-ea desde recordCost. Nunca tira.
async function persist({ tenant, userId, task, u }) {
  try {
    if (!supabaseAdmin) return;
    const companyId = tenant || (await resolveCompany(userId));
    await supabaseAdmin.from('ai_usage').insert({
      company_id: companyId || null,
      user_id: userId || null,
      task,
      provider: u.provider,
      model: u.model,
      input_tokens: u.inputTokens,
      output_tokens: u.outputTokens,
      cache_read_tokens: u.cacheReadTokens,
      cache_write_tokens: u.cacheWriteTokens,
    });
  } catch (e) {
    if (process.env.AI_LOG_COST === '1') console.error('[ai:cost] persist error (ignorado):', e.message);
  }
}

function recordCost({ tenant, userId, task, provider, model, usage }) {
  try {
    const u = normalizeUsage(provider, model, usage);
    void persist({ tenant, userId, task, u }).catch(() => {});
    if (process.env.AI_LOG_COST === '1') {
      console.log(`[ai:cost] tenant=${tenant || 'n/a'} task=${task} ${provider}/${model} in=${u.inputTokens} out=${u.outputTokens} cacheRead=${u.cacheReadTokens} ~$${estimateCost(u).toFixed(6)}`);
    }
    return u;
  } catch (e) {
    console.error('[ai:cost] recordCost error (ignorado):', e.message);
    return null;
  }
}

module.exports = { recordCost, normalizeUsage, resolveCompany };
