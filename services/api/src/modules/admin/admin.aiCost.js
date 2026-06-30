// admin.aiCost — GET /ai-cost: costo de IA agregado por tenant (ledger ai_usage). Solo super_admin.
// Datos cross-tenant → nunca company_admin. Costo USD estimado con tarifas vigentes (rates.js).
const express = require('express');
const auth = require('../../middleware/auth');
const requireRole = require('../../middleware/requireAdmin');
const { supabaseAdmin } = require('../../lib/supabase');
const { aggregateByTenant } = require('../../platform/ai/cost/report');

const router = express.Router();

router.get('/ai-cost', auth, requireRole('super_admin'), async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase service role no configurado' });
  }

  const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 30));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const { data: rows, error } = await supabaseAdmin.rpc('ai_usage_summary', { p_since: since });
    if (error) throw error;

    // Resolver nombres de tenant para mostrar (no exponer solo UUIDs).
    const ids = [...new Set((rows || []).map(r => r.company_id).filter(Boolean))];
    const names = {};
    if (ids.length) {
      const { data: comps } = await supabaseAdmin.from('companies').select('id, name, slug').in('id', ids);
      for (const c of comps || []) names[c.id] = c.name || c.slug || null;
    }

    const { tenants, totals } = aggregateByTenant(rows || [], names);
    res.json({ since, days, totals, tenants });
  } catch (err) {
    console.error('[admin.aiCost] Error:', err.message);
    res.status(500).json({ error: 'No se pudo obtener el costo de IA' });
  }
});

module.exports = router;
