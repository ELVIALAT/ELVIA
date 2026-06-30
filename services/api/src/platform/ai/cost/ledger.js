// Ledger de costo de IA por tenant.
// En la fase router (pasos 1-3) es un stub: normaliza el `usage` de cada provider a una forma
// común y lo deja listo para persistir. La persistencia en BD + dashboard = paso 4.
//
// INVARIANTE: recordCost NUNCA debe tirar. El costo es telemetría — no puede romper
// una llamada de IA si el registro falla.

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

function recordCost({ tenant, task, provider, model, usage }) {
  try {
    const u = normalizeUsage(provider, model, usage);
    // TODO(paso 4): persistir en tabla ai_usage (tenant_id, task, provider, model, tokens, ts).
    if (process.env.AI_LOG_COST === '1') {
      console.log(`[ai:cost] tenant=${tenant || 'n/a'} task=${task} ${provider}/${model} in=${u.inputTokens} out=${u.outputTokens} cacheRead=${u.cacheReadTokens}`);
    }
    return u;
  } catch (e) {
    console.error('[ai:cost] recordCost error (ignorado):', e.message);
    return null;
  }
}

module.exports = { recordCost, normalizeUsage };
