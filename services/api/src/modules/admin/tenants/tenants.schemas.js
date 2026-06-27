// Schemas Zod del sub-módulo tenants (admin super_admin).
// Movido desde src/schemas/index.js (Fase 2).
const { z } = require('zod')

const email = z.string().trim().toLowerCase().email('correo inválido').max(254)
const nombre = z.string().trim().min(1).max(100)
const optionalShortText = z.string().trim().max(200).optional()

// ── POST /admin/tenants (crear empresa + HR) ──
const adminCreateTenant = z.object({
  nombre: nombre,
  slug: z.string().trim().regex(/^[a-z0-9-]{2,60}$/, 'slug inválido (a-z, 0-9, guiones, 2-60)'),
  sector: optionalShortText,
  plan: optionalShortText,
  country: z.string().trim().max(4).optional(),
  hr_nombre: nombre,
  hr_email: email,
  hr_apellido: z.string().trim().max(100).optional().default(''),
  branding_mode: z.enum(['cobranded', 'tenant_only', 'elvia_only']).optional(),
  allowed_email_domain: z.string().trim().max(120).optional(),
  require_allowlist: z.boolean().optional(),
  require_invite: z.boolean().optional(),
}).passthrough() // muchos campos opcionales de branding

module.exports = { adminCreateTenant }
