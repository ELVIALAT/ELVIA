// admin.system — GET /system-status: health check de integraciones externas
// (Supabase DB, Anthropic, Resend, Sentry). Solo super_admin.

const express = require('express')
const auth = require('../../middleware/auth')
const requireRole = require('../../middleware/requireAdmin')
const { supabase } = require('../../lib/supabase')

const router = express.Router()

router.get('/system-status', auth, requireRole('super_admin'), async (req, res) => {
  const results = {
    database: { name: 'Supabase DB', status: 'unknown', details: '' },
    auth:     { name: 'Supabase Auth', status: 'unknown', details: '' },
    ai:       { name: 'Anthropic (Claude)', status: 'unknown', details: '' },
    email:    { name: 'Resend (Email)', status: 'unknown', details: '' },
    sentry:   { name: 'Sentry (Error Monitoring)', status: 'unknown', details: '' },
  }

  // 1. Supabase (DB) — latencia de un count liviano.
  try {
    const t0 = Date.now()
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    if (error) throw error
    results.database.status = 'active'
    results.database.details = `Latency: ${Date.now() - t0}ms`
  } catch (err) {
    results.database.status = 'error'
    results.database.details = err.message
  }

  // 2. Anthropic — solo presencia de API key (no llamada real, para no gastar).
  try {
    if (process.env.ANTHROPIC_API_KEY) {
      results.ai.status = 'configured'
      results.ai.details = 'API Key present'
    } else {
      results.ai.status = 'inactive'
      results.ai.details = 'Missing API Key'
    }
  } catch (err) {
    results.ai.status = 'error'
  }

  // 3. Resend.
  try {
    if (process.env.RESEND_API_KEY) {
      results.email.status = 'configured'
      results.email.details = 'API Key present'
    } else {
      results.email.status = 'inactive'
      results.email.details = 'Missing API Key'
    }
  } catch (err) {
    results.email.status = 'error'
  }

  // 4. Sentry.
  try {
    if (process.env.SENTRY_DSN) {
      results.sentry.status = 'active'
      results.sentry.details = 'DSN configured'
    } else {
      results.sentry.status = 'inactive'
      results.sentry.details = 'No Sentry DSN provided'
    }
  } catch (err) {
    results.sentry.status = 'error'
  }

  res.json(results)
})

module.exports = router
