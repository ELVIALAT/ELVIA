// tenants.routes — wiring de la familia tenants/companies (super_admin).
// Asume que el router padre (admin.routes) ya aplicó auth + auditAdmin; aquí se
// reaplica auth + requireRole('super_admin') por ruta (fiel al original).

const express = require('express')
const multer = require('multer')
const rateLimit = require('express-rate-limit')

const auth = require('../../../middleware/auth')
const requireRole = require('../../../middleware/requireAdmin')
const { validate } = require('../../../middleware/validate')
const { adminCreateTenant } = require('./tenants.schemas')
const ctrl = require('./tenants.controller')

const router = express.Router()
const superAdmin = [auth, requireRole('super_admin')]

// Rate limiter para creación de tenants: 10 por admin/IP por hora.
const tenantCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: (req, res) => res.status(429).json({ error: 'Demasiadas creaciones de tenant. Intenta en una hora.' }),
})

// Logo upload: 2MB, solo imágenes.
const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.mimetype)
    cb(ok ? null : new Error('Formato no permitido: usa PNG, JPEG, WebP o SVG'), ok)
  },
})

router.get('/companies', ...superAdmin, ctrl.listCompanies)
router.patch('/companies/:id', ...superAdmin, ctrl.patchCompany)
router.post('/companies/:id/logo',
  ...superAdmin,
  (req, res, next) => logoUpload.single('logo')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message, code: 'INVALID_UPLOAD' })
    next()
  }),
  ctrl.uploadLogo,
)

router.get('/tenants/check-slug/:slug', ...superAdmin, ctrl.checkSlug)
router.post('/tenants', ...superAdmin, tenantCreateLimiter, validate(adminCreateTenant), ctrl.createTenant)

module.exports = router
