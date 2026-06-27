// tenancy.routes — wiring de /api/company/*.
//
// ⚠️  Conservar EXACTAMENTE la cadena de middlewares de cada ruta. Relajar
// auth/role/tenant/MFA = hueco de seguridad. La cadena HR canónica es:
//   auth, requireRole('company_admin'), requireTenantContext, requireMFA
// requireTenantContext pone/exige req.companyId; sin él, el aislamiento del
// repository (que filtra por companyId) no tendría tenant que aplicar → 400.

const express = require('express')
const rateLimit = require('express-rate-limit')

const auth = require('../../middleware/auth')
const requireRole = require('../../middleware/requireAdmin')
const requireTenantContext = require('../../middleware/requireTenantContext')
const requireMFA = require('../../middleware/requireMFA')
const { validate } = require('../../middleware/validate')
const { companyRegistration, allowlistBulk } = require('./tenancy.schemas')
const ctrl = require('./tenancy.controller')

const router = express.Router()

// Cadena estándar para rutas de HR (company_admin con tenant + MFA).
const hr = [auth, requireRole('company_admin'), requireTenantContext, requireMFA]

// Rate limiter para registro público B2B: 5 intentos por IP por hora.
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  handler: (req, res) => res.status(429).json({ error: 'Demasiados intentos de registro. Intenta en una hora.' }),
})

// ── Públicos (sin auth) ──
router.get('/registration/:slug', ctrl.getBySlug)
router.get('/branding/:slug', ctrl.getBySlug)
router.post('/registration/:slug', registrationLimiter, validate(companyRegistration), ctrl.register)

// ── Autenticados (usuario) ──
router.get('/my-tenant', auth, ctrl.myTenant)
router.post('/confirm-activation', auth, ctrl.confirmActivation)

// ── HR: usuarios ──
router.get('/users', ...hr, ctrl.listUsers)
router.post('/users', ...hr, ctrl.createUser)
router.patch('/users/:id', ...hr, ctrl.updateUser)
router.delete('/users/:id', ...hr, ctrl.deleteUser)

// ── HR: invitaciones ──
router.get('/invitations', ...hr, ctrl.listInvitations)
router.post('/invitations', ...hr, ctrl.createInvitation)
router.delete('/invitations/:id', ...hr, ctrl.deleteInvitation)

// ── HR: perfil de empresa ──
router.get('/profile', ...hr, ctrl.getProfile)
router.patch('/profile', ...hr, ctrl.updateProfile)

// ── HR: dashboard / costos ──
router.get('/dashboard', ...hr, ctrl.dashboard)
router.get('/costs', ...hr, ctrl.costs)
router.post('/costs/export', ...hr, ctrl.exportCosts)

// ── HR: allowlist ──
router.get('/allowlist', ...hr, ctrl.getAllowlist)
router.post('/allowlist/bulk', ...hr, validate(allowlistBulk), ctrl.bulkAllowlist)
router.patch('/allowlist/:id', ...hr, ctrl.patchAllowlist)
router.delete('/allowlist/:id', ...hr, ctrl.deleteAllowlist)

module.exports = router
