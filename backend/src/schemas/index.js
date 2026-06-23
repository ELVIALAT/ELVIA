// Schemas Zod para validación en boundaries (Fase 1, tarea 4).
// Cubre las 6 rutas de mayor superficie del plan maestro.
// Regla: validar y rechazar con 400 + envelope antes de tocar lógica/DB.
const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('correo inválido').max(254);
const password = z.string().min(8, 'mínimo 8 caracteres').max(200);
const nombre = z.string().trim().min(1).max(100);
const optionalShortText = z.string().trim().max(200).optional();

// NOTA: cvOptimize movido a src/modules/cv/cv.schemas.js (Fase 2).
// NOTA: companyRegistration y allowlistBulk movidos a
//       src/modules/tenancy/tenancy.schemas.js (Fase 2).

// ── /admin/tenants (crear empresa + HR) ──
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
}).passthrough(); // muchos campos opcionales de branding

// NOTA: jobsCompatibility movido a src/modules/jobs/jobs.schemas.js (Fase 2).

// NOTA: el schema de email/send se movió a
// src/modules/notifications/notifications.schemas.js (Fase 2).

module.exports = {
  adminCreateTenant,
};
