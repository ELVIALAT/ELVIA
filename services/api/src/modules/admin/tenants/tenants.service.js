// tenants.service — lógica de negocio del super_admin sobre empresas/tenants:
// listar, patch de branding/config, upload de logo, check-slug y el wizard
// transaccional (crea empresa + HR admin).
//
// Errores de dominio: DomainError({ status, code, message }) para mapear a HTTP.

const crypto = require('crypto')
const repo = require('./tenants.repository')
const { supabaseAdmin } = require('../../../lib/supabase')
const logAudit = require('../../../lib/logAudit')
const { sendHRWelcomeEmail } = require('../../../services/resendService')

class DomainError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Whitelist de campos editables vía PATCH /companies/:id.
const COMPANY_PATCHABLE_FIELDS = [
  'is_active', 'name', 'sector', 'plan', 'country',
  'logo_url', 'logo_secondary',
  'primary_color', 'secondary_color', 'accent_color',
  'hero_title', 'hero_subtitle', 'welcome_message',
  'branding_mode', 'show_program_badge', 'program_badge_text',
  'allowed_email_domain', 'require_allowlist', 'require_invite', 'require_mfa',
  'contact_email', 'support_email',
]
const ALLOWED_BRANDING_MODES = ['cobranded', 'tenant_only', 'elvia_only']
const ALLOWED_SECTORS = ['corporate', 'university', 'government']
const SLUG_RE = /^[a-z0-9-]{2,60}$/

// ── Listado ──────────────────────────────────────────────────────────────

async function listCompanies() {
  return repo.listCompanies()
}

// ── PATCH company (whitelist + enums + audit) ──────────────────────────────

async function patchCompany(companyId, body, actorUserId) {
  const update = {}
  for (const key of COMPANY_PATCHABLE_FIELDS) {
    if (body[key] !== undefined) update[key] = body[key]
  }
  if (Object.keys(update).length === 0) {
    throw new DomainError(400, 'NO_FIELDS', 'No hay campos válidos para actualizar')
  }
  if (update.branding_mode && !ALLOWED_BRANDING_MODES.includes(update.branding_mode)) {
    throw new DomainError(400, 'INVALID_BRANDING_MODE', 'branding_mode inválido')
  }
  if (update.sector && !ALLOWED_SECTORS.includes(update.sector)) {
    throw new DomainError(400, 'INVALID_SECTOR', 'sector inválido')
  }

  const company = await repo.updateCompany(companyId, update)

  logAudit(supabaseAdmin, {
    company_id: companyId,
    user_id: actorUserId,
    action: 'config_changed',
    entity: 'companies',
    entity_id: companyId,
    metadata: { fields: Object.keys(update) },
  }).catch(e => console.error('[Audit] config_changed:', e.message))

  return company
}

// ── Logo upload ────────────────────────────────────────────────────────────

async function uploadLogo(companyId, file, which, actorUserId) {
  if (!file) throw new DomainError(400, 'NO_FILE', 'No se recibió archivo (campo: logo)')
  const slot = which === 'secondary' ? 'secondary' : 'primary'

  const company = await repo.getCompanySlug(companyId)
  if (!company) throw new DomainError(404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada')

  // Path determinístico: {slug}/logo_{slot}.{ext}
  const ext = file.mimetype.split('/')[1].replace('svg+xml', 'svg')
  const path = `${company.slug}/logo_${slot}.${ext}`

  const { error: upErr } = await repo.uploadLogo(path, file.buffer, file.mimetype)
  if (upErr) {
    console.error('[Admin] Logo upload:', upErr.message)
    throw new DomainError(500, 'LOGO_UPLOAD_FAILED', 'Error subiendo logo: ' + upErr.message)
  }

  const logoUrl = repo.getLogoPublicUrl(path)
  const updateField = slot === 'secondary' ? 'logo_secondary' : 'logo_url'
  await repo.updateCompany(companyId, { [updateField]: logoUrl })

  logAudit(supabaseAdmin, {
    company_id: companyId,
    user_id: actorUserId,
    action: 'config_changed',
    entity: 'companies',
    entity_id: companyId,
    metadata: { logo_uploaded: slot, path },
  }).catch(e => console.error('[Audit] logo upload:', e.message))

  return { [updateField]: logoUrl, path }
}

// ── Check slug ─────────────────────────────────────────────────────────────

async function checkSlug(slug) {
  if (!SLUG_RE.test(slug)) {
    return { available: false, reason: 'Solo letras minúsculas, números y guiones (2-60 chars)' }
  }
  const existing = await repo.findCompanyBySlug(slug)
  return { available: !existing, slug }
}

// ── Wizard: crear empresa + HR admin (saga con rollback) ───────────────────

async function createTenant(body, actorUserId) {
  const {
    nombre, slug,
    sector = 'corporate', plan = 'professional', country = 'MX',
    logo_url, primary_color = '#0066FF', secondary_color = '#0D1B2A', accent_color = '#00D4FF',
    hero_title, hero_subtitle, welcome_message,
    branding_mode = 'cobranded', show_program_badge = true, program_badge_text,
    allowed_email_domain, require_allowlist = false, require_invite = false,
    hr_nombre, hr_email, hr_apellido = '',
  } = body

  if (!ALLOWED_BRANDING_MODES.includes(branding_mode)) {
    throw new DomainError(400, 'INVALID_BRANDING_MODE', 'branding_mode inválido')
  }
  if (!nombre || !slug || !hr_nombre || !hr_email) {
    throw new DomainError(400, 'MISSING_FIELDS', 'nombre, slug, hr_nombre y hr_email son requeridos')
  }
  if (!SLUG_RE.test(slug)) {
    throw new DomainError(400, 'INVALID_SLUG', 'Slug inválido: solo letras minúsculas, números y guiones (2-60 chars)')
  }

  const existing = await repo.findCompanyBySlug(slug)
  if (existing) {
    throw new DomainError(409, 'SLUG_CONFLICT', `El slug "${slug}" ya está en uso`)
  }

  // Password aleatoria descartable: el HR setea la suya vía recovery link.
  const initialPassword = crypto.randomBytes(32).toString('hex')
  let company = null
  let hrUserId = null

  try {
    // 1. Crear empresa.
    company = await repo.insertCompany({
      name: nombre, slug, sector, plan, country,
      logo_url: logo_url || null,
      primary_color, secondary_color, accent_color,
      hero_title: hero_title || null,
      hero_subtitle: hero_subtitle || null,
      welcome_message: welcome_message || null,
      branding_mode,
      show_program_badge,
      program_badge_text: program_badge_text || null,
      allowed_email_domain: allowed_email_domain || null,
      require_allowlist, require_invite,
      is_active: true, is_template: false,
      created_by: actorUserId,
    })

    // 2. Crear auth user del HR (password descartable).
    const { data: authUser, error: authErr } = await repo.createHrAuthUser({
      email: hr_email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { nombre: hr_nombre, apellido: hr_apellido },
    })
    if (authErr) {
      await repo.deleteCompany(company.id).catch(() => {})
      throw new DomainError(500, 'HR_AUTH_FAILED', `Error creando usuario HR: ${authErr.message}`)
    }
    hrUserId = authUser.user.id

    // 3. Upsert perfil company_admin (upsert por el trigger handle_new_user).
    try {
      await repo.upsertHrProfile({
        id: hrUserId,
        email_principal: hr_email,
        nombre1: hr_nombre,
        apellido1: hr_apellido,
        role: 'company_admin',
        company_id: company.id,
        plan: 'business',
        is_admin: false,
      })
    } catch (profileErr) {
      await repo.deleteAuthUser(hrUserId).catch(() => {})
      await repo.deleteCompany(company.id).catch(() => {})
      throw new DomainError(500, 'HR_PROFILE_FAILED', `Error creando perfil HR: ${profileErr.message}`)
    }

    // 4. Recovery link para que el HR setee su contraseña.
    const frontendUrl = process.env.FRONTEND_URL || 'https://elvia.lat'
    const hrUrl = `${frontendUrl}/empresas/${slug}/hr`
    const { data: linkData, error: linkErr } = await repo.generateRecoveryLink(hr_email, `${frontendUrl}/reset-password`)
    if (linkErr) {
      console.error('[Admin/Tenants] generateLink falló:', linkErr.message)
    }
    const setupLink = linkData?.properties?.action_link || `${frontendUrl}/reset-password`

    // 5. Email de bienvenida (no bloqueante) — incluye magic link, NO la password.
    sendHRWelcomeEmail(hr_email, { hrNombre: hr_nombre, companyName: nombre, hrUrl, setupLink })
      .catch(e => console.error('[Admin/Tenants] Email HR no enviado:', e.message))

    // 6. Audit log.
    await logAudit(supabaseAdmin, {
      company_id: company.id,
      user_id: actorUserId,
      action: 'tenant_created',
      entity: 'companies',
      entity_id: company.id,
      metadata: { slug, hr_email, sector, plan },
    })

    console.log(`[Admin] Tenant "${slug}" creado por ${actorUserId}. HR: ${hr_email}`)
    return { company, hr_email, hr_url: hrUrl }
  } catch (err) {
    if (err instanceof DomainError) throw err
    console.error('[Admin/Tenants] Error:', err.message)
    throw new DomainError(500, 'TENANT_CREATE_FAILED', err.message)
  }
}

module.exports = {
  DomainError,
  COMPANY_PATCHABLE_FIELDS,
  ALLOWED_BRANDING_MODES,
  ALLOWED_SECTORS,
  listCompanies,
  patchCompany,
  uploadLogo,
  checkSlug,
  createTenant,
}
