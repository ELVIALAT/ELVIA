// Schemas Zod del módulo tenancy (company B2B).
// Movidos desde src/schemas/index.js (Fase 2). Validan en el boundary HTTP
// antes de tocar lógica o DB.
const { z } = require('zod')

const email = z.string().trim().toLowerCase().email('correo inválido').max(254)
const password = z.string().min(8, 'mínimo 8 caracteres').max(200)
const nombre = z.string().trim().min(1).max(100)
const optionalShortText = z.string().trim().max(200).optional()

// ── POST /company/registration/:slug ──
const companyRegistration = z.object({
  email,
  password,
  nombre: nombre.optional(),
  apellido: z.string().trim().max(100).optional(),
  invite_token: z.string().max(200).optional(),
})

// ── POST /company/allowlist/bulk ──
const allowlistBulk = z.object({
  rows: z.array(z.object({
    email,
    nombre: z.string().trim().max(100).optional(),
    apellido: z.string().trim().max(100).optional(),
    telefono: z.string().trim().max(40).optional(),
    pais: z.string().trim().max(60).optional(),
    cohort: z.string().trim().max(100).optional(),
    license_days: z.coerce.number().int().min(0).max(3650).optional(),
  })).min(1, 'al menos una fila').max(1000, 'máximo 1000 filas por carga'),
  cohort_default: optionalShortText,
})

module.exports = { companyRegistration, allowlistBulk }
