// Agregación de costo de IA para el dashboard. Toma las filas de la RPC ai_usage_summary
// (agrupadas por tenant + modelo) y computa el costo USD por modelo con las tarifas vigentes,
// sumando por tenant. Función pura → testeable sin BD.
const { estimateCost } = require('./rates');

function aggregateByTenant(rows = [], names = {}) {
  const byTenant = new Map();

  for (const r of rows) {
    const key = r.company_id || '__none__';
    if (!byTenant.has(key)) {
      byTenant.set(key, {
        company_id: r.company_id || null,
        name: names[r.company_id] || null,
        calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0,
        costUsd: 0, byModel: [],
      });
    }
    const t = byTenant.get(key);
    const inputTokens = Number(r.input_tokens || 0);
    const outputTokens = Number(r.output_tokens || 0);
    const cacheReadTokens = Number(r.cache_read_tokens || 0);
    const cacheWriteTokens = Number(r.cache_write_tokens || 0);
    const calls = Number(r.calls || 0);
    const costUsd = estimateCost({ model: r.model, inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens });

    t.calls += calls;
    t.inputTokens += inputTokens;
    t.outputTokens += outputTokens;
    t.cacheReadTokens += cacheReadTokens;
    t.cacheWriteTokens += cacheWriteTokens;
    t.costUsd += costUsd;
    t.byModel.push({ provider: r.provider, model: r.model, calls, inputTokens, outputTokens, costUsd: round6(costUsd) });
  }

  const tenants = [...byTenant.values()]
    .map(t => ({ ...t, costUsd: round6(t.costUsd) }))
    .sort((a, b) => b.costUsd - a.costUsd);

  const totals = tenants.reduce(
    (acc, t) => ({ calls: acc.calls + t.calls, costUsd: round6(acc.costUsd + t.costUsd) }),
    { calls: 0, costUsd: 0 },
  );

  return { tenants, totals };
}

const round6 = (n) => Math.round(n * 1e6) / 1e6;

module.exports = { aggregateByTenant };
