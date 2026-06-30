// Tarifas de modelos para ESTIMAR costo en el dashboard. USD por 1.000.000 de tokens.
//
// ⚠️ APROXIMADAS — verificar contra los precios oficiales vigentes antes de tomar
// decisiones de presupuesto. El ledger guarda TOKENS CRUDOS; el costo se computa al leer,
// así que actualizar estas tarifas NO requiere migrar datos.
//
// Patrón de caching en Claude: cacheRead ≈ 0.1× input, cacheWrite ≈ 1.25× input.
const RATES = {
  'claude-sonnet-4-6':         { input: 3.00, output: 15.00, cacheRead: 0.30,  cacheWrite: 3.75 },
  'claude-haiku-4-5-20251001': { input: 1.00, output: 5.00,  cacheRead: 0.10,  cacheWrite: 1.25 },
  'deepseek-chat':             { input: 0.27, output: 1.10,  cacheRead: 0.027, cacheWrite: 0 },
};

const _ZERO = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };

// Costo estimado en USD de una llamada, a partir de sus tokens normalizados.
function estimateCost({ model, inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, cacheWriteTokens = 0 }) {
  const r = RATES[model] || _ZERO;
  return (
    inputTokens * r.input +
    outputTokens * r.output +
    cacheReadTokens * r.cacheRead +
    cacheWriteTokens * r.cacheWrite
  ) / 1e6;
}

module.exports = { RATES, estimateCost };
