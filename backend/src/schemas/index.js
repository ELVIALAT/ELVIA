// Schemas Zod para validación en boundaries (Fase 1, tarea 4).
// Cubre las 6 rutas de mayor superficie del plan maestro.
// Regla: validar y rechazar con 400 + envelope antes de tocar lógica/DB.
const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('correo inválido').max(254);
const password = z.string().min(8, 'mínimo 8 caracteres').max(200);
const nombre = z.string().trim().min(1).max(100);
const optionalShortText = z.string().trim().max(200).optional();

// ── /cv/optimize (multipart: el archivo va aparte; aquí los campos de texto) ──
const cvOptimize = z.object({
  language: z.enum(['es', 'en']).optional().default('es'),
  jobText: z.string().max(20000).optional(),
  cvId: z.string().uuid().optional(),
}).passthrough(); // multer agrega campos; no rechazar por extras

// ── /company/registration/:slug ──
const companyRegistration = z.object({
  email,
  password,
  nombre: nombre.optional(),
  apellido: z.string().trim().max(100).optional(),
  invite_token: z.string().max(200).optional(),
});

// ── /company/allowlist/bulk ──
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
});

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

// ── /jobs/compatibility ──
const jobsCompatibility = z.object({
  cvText: z.string().min(1).max(50000),
  jobTitle: z.string().trim().min(1).max(300),
  jobCompany: z.string().trim().max(300).optional(),
  jobSnippet: z.string().max(10000).optional(),
  jobLink: z.string().url().max(2000).optional().or(z.literal('')),
  jobLocation: z.string().trim().max(300).optional(),
  jobVia: z.string().trim().max(120).optional(),
});

// ── /email (enviar CV por correo) ──
const emailSend = z.object({
  to: email,
  cvId: z.string().uuid(),
  format: z.enum(['pdf', 'word']).optional().default('pdf'),
});

module.exports = {
  cvOptimize,
  companyRegistration,
  allowlistBulk,
  adminCreateTenant,
  jobsCompatibility,
  emailSend,
};
