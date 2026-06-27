// admin.audit — GET /audit-log: lista acciones B2B de tenant_audit_log con join
// a companies, paginado con .range(). Solo super_admin.

const express = require('express')
const auth = require('../../middleware/auth')
const requireRole = require('../../middleware/requireAdmin')
const { supabaseAdmin } = require('../../lib/supabase')

const router = express.Router()

router.get('/audit-log', auth, requireRole('super_admin'), async (req, res) => {
  try {
    const { company_id, limit = 50, offset = 0 } = req.query
    let query = supabaseAdmin
      .from('tenant_audit_log')
      .select('*, companies:company_id(name, slug)')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (company_id) query = query.eq('company_id', company_id)

    const { data, error } = await query
    if (error) throw error
    res.json({ logs: data || [] })
  } catch (err) {
    console.error('[Admin] Error leyendo audit log:', err.message)
    res.status(500).json({ error: 'Error leyendo audit log' })
  }
})

module.exports = router
