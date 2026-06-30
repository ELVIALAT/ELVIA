// admin.routes — monta las funcionalidades del panel super_admin.
//
// ⚠️ ORDEN CRÍTICO (igual que el routes/admin.js original):
//   1. cron — ANTES de auth: el Railway Cron no tiene sesión de usuario, se
//      protege solo con CRON_SECRET. Si se monta después de auth, se rompe.
//   2. auth + auditAdmin — gate global para TODO lo demás: exige sesión y
//      audita las acciones mutantes (POST/PUT/PATCH/DELETE) en admin_audit_log.
//   3. resto de funcionalidades (cada ruta reaplica requireRole('super_admin')).

const express = require('express')
const auth = require('../../middleware/auth')
const auditAdmin = require('../../middleware/auditAdmin')

const router = express.Router()

// 1. Cron (sin auth de usuario).
router.use(require('./admin.cron'))

// 2. Gate global: autenticación + auditoría de acciones del panel.
router.use(auth, auditAdmin)

// 3. Funcionalidades autenticadas.
router.use(require('./admin.system'))
router.use(require('./admin.users'))
router.use(require('./admin.config'))
router.use(require('./admin.audit'))
router.use(require('./admin.knowledge'))
router.use(require('./admin.aiCost'))
router.use(require('./tenants/tenants.routes'))

module.exports = router
