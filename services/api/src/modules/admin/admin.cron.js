// admin.cron — endpoint disparado por Railway Cron (diario).
//
// ⚠️ Se monta ANTES de auth+auditAdmin en admin.routes.js: NO requiere sesión de
// usuario. Su única protección es CRON_SECRET en el header Authorization.

const express = require('express')
const { runEmailTriggers } = require('../../controllers/cronController')

const router = express.Router()

// Gate por CRON_SECRET (Bearer). 503 si no está configurado, 401 si no coincide.
function requireCronSecret(req, res, next) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[Cron] CRON_SECRET no configurado — endpoint deshabilitado')
    return res.status(503).json({ error: 'Endpoint no disponible' })
  }
  const authHeader = req.headers.authorization || ''
  if (authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'No autorizado' })
  }
  next()
}

router.post('/cron/email-triggers', requireCronSecret, runEmailTriggers)

module.exports = router
