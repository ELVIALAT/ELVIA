// tenancy.registration.service — flujo PÚBLICO de auto-registro y activación.
//
// Estos flujos NO tienen company_admin: el tenant se deriva del slug (registro)
// o del propio perfil del usuario autenticado (confirm-activation). Por eso el
// aislamiento se ancla en el slug/email exactos y en validar que el usuario
// pertenezca a SU propia empresa antes de tocar nada.
//
// Errores de dominio: se lanzan con { status, code, message } para que el
// controller los traduzca a HTTP sin filtrar detalle técnico.

const repo = require('./tenancy.repository')
const logAudit = require('../../lib/logAudit')
const { sendBienvenidaActivacionEmail } = require('../../services/resendService')

const PII_CONSENT_VERSION = '2026-05-26-v1'

// Error de dominio con código estable para el controller.
// `details` (opcional) lleva payload extra para el cliente (p.ej. errores por fila).
class DomainError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── POST /registration/:slug ──────────────────────────────────────────────
// Auto-registro público de un colaborador en una empresa por slug.
// Devuelve { ok, message, linked, user } o lanza DomainError.
async function registerBySlug(db, slug, { email, password, nombre, apellido, invite_token }) {
  if (!email || !password) {
    throw new DomainError(400, 'MISSING_FIELDS', 'Email y contraseña requeridos')
  }
  if (!emailRegex.test(email)) {
    throw new DomainError(400, 'INVALID_EMAIL', 'Formato de email inválido')
  }
  if (password.length < 8) {
    throw new DomainError(400, 'WEAK_PASSWORD', 'La contraseña debe tener al menos 8 caracteres')
  }

  // 1. Empresa activa por slug (con gates de acceso).
  const company = await repo.getCompanyGatesBySlug(db, slug)
  if (!company) {
    throw new DomainError(404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada o inactiva')
  }

  // 1a. Gate por dominio corporativo.
  if (company.allowed_email_domain) {
    const userDomain = email.split('@')[1]?.toLowerCase()
    const requiredDomain = company.allowed_email_domain.toLowerCase()
    if (userDomain !== requiredDomain) {
      throw new DomainError(403, 'DOMAIN_NOT_ALLOWED',
        `El acceso a ${company.name} requiere un correo corporativo @${requiredDomain}.`)
    }
  }

  // 1c. Gate por allowlist (email pre-aprobado por HR).
  let allowlistRow = null
  if (company.require_allowlist) {
    const row = await repo.getAllowlistByEmail(db, company.id, email,
      'id, status, nombre, apellido, cohort, area, cargo_actual')
    if (!row) {
      throw new DomainError(403, 'NOT_IN_ALLOWLIST',
        `Tu correo no esta en la lista aprobada del programa ${company.name}. Contacta a tu area de RRHH para que te incluyan.`)
    }
    if (row.status === 'revoked') {
      throw new DomainError(403, 'ACCESS_REVOKED',
        `Tu acceso al programa ${company.name} fue revocado. Contacta a RRHH.`)
    }
    allowlistRow = row
  }

  // 1b. Gate por invitación.
  if (company.require_invite) {
    if (!invite_token) {
      throw new DomainError(403, 'INVITE_REQUIRED',
        `El acceso a ${company.name} requiere un código de invitación.`)
    }
    const invitation = await repo.getInvitationByToken(db, company.id, invite_token)
    if (!invitation || invitation.status !== 'pending') {
      throw new DomainError(403, 'INVALID_INVITE', 'Invitación inválida o ya utilizada.')
    }
    if (new Date(invitation.expires_at) < new Date()) {
      throw new DomainError(403, 'INVITE_EXPIRED', 'Esta invitación ha expirado.')
    }
    if (invitation.email && invitation.email.toLowerCase() !== email.toLowerCase()) {
      throw new DomainError(403, 'INVITE_EMAIL_MISMATCH', 'Esta invitación fue emitida para otro correo.')
    }
  }

  // 2. Crear user en Auth (auto-confirmando email: la empresa ya validó al
  //    colaborador). Si el email ya existe, NO hacemos re-link silencioso.
  let userId = null
  let userEmail = email
  let createdNow = false

  const { data: authUser, error: authErr } = await repo.auth.createUser(db, {
    email,
    password,
    email_confirm: true,
  })

  if (authErr) {
    const msg = (authErr.message || '').toLowerCase()
    const isDuplicate = msg.includes('already') || msg.includes('registered') || msg.includes('exists') || authErr.status === 422
    if (!isDuplicate) {
      console.error('Auth error:', authErr)
      throw new DomainError(400, 'AUTH_ERROR', authErr.message || 'Error al crear usuario')
    }
    // SECURITY (Audit P0): el registro abierto no puede vincular cuentas ajenas
    // a un tenant sin prueba de control del email → forzar flujo invite-only.
    throw new DomainError(409, 'EMAIL_EXISTS',
      'Este correo ya está registrado. Si pertenece a este programa, inicia sesión. Si no, contacta a tu administrador HR para que te envíe una invitación.')
  }

  userId = authUser.user.id
  userEmail = authUser.user.email
  createdNow = true

  // 3. Upsert profile vinculado al tenant (con companyId obligatorio).
  const profileData = {
    id: userId,
    email_principal: userEmail,
    nombre1: (allowlistRow?.nombre || nombre || '').trim(),
    apellido1: (allowlistRow?.apellido || apellido || '').trim(),
    role: 'user',
    plan: 'pro',
    pii_consent_at: new Date().toISOString(),
    pii_consent_version: PII_CONSENT_VERSION,
  }
  if (allowlistRow?.cohort) profileData.cohort = allowlistRow.cohort

  let profile
  try {
    profile = await repo.upsertTenantProfile(db, company.id, profileData)
  } catch (profileErr) {
    console.error('Profile upsert error:', profileErr)
    // Rollback solo si nosotros creamos el user en este request.
    if (createdNow) {
      await repo.auth.deleteUser(db, userId).catch(() => {})
    }
    throw new DomainError(500, 'PROFILE_FAILED', 'Error al crear perfil de usuario')
  }

  // 4. Marcar allowlist como activated (best-effort; no rompe el flujo).
  if (allowlistRow) {
    try {
      await repo.markAllowlistActivated(db, company.id, allowlistRow.id, {
        status: 'activated',
        activated_at: new Date().toISOString(),
        activated_user_id: userId,
      })
    } catch (e) {
      console.warn('No se pudo marcar allowlist activated:', e.message)
    }
  }

  return {
    ok: true,
    message: createdNow
      ? 'Usuario registrado exitosamente.'
      : 'Tu cuenta existente fue vinculada al programa exitosamente.',
    linked: !createdNow,
    user: { id: userId, email: userEmail, company_id: profile.company_id },
  }
}

// ── POST /confirm-activation ──────────────────────────────────────────────
// El usuario ya tiene sesión (seteó su contraseña). Marca allowlist activada +
// invitación aceptada + consentimiento PII. Idempotente.
async function confirmActivation(db, { userId, userEmail }) {
  const profile = await repo.getOwnProfile(db, userId, 'company_id, email_principal, role')
  const companyId = profile?.company_id
  const email = (profile?.email_principal || userEmail || '').toLowerCase()

  if (!companyId) {
    return { ok: true, skipped: true }
  }

  // Defensa: el usuario debe estar en el allowlist de SU propia empresa.
  const allowEntry = await repo.getAllowlistByEmail(db, companyId, email,
    'id, status, company_id, nombre, apellido, license_days')

  if (!allowEntry) {
    throw new DomainError(403, 'NOT_AUTHORIZED', 'No estás autorizado en esta empresa')
  }
  if (allowEntry.status === 'revoked') {
    throw new DomainError(403, 'ACCESS_REVOKED', 'Tu acceso ha sido revocado')
  }

  const activatedAt = new Date()
  const licenseDays = allowEntry.license_days || 90
  const licenseExpiresAt = new Date(activatedAt.getTime() + licenseDays * 24 * 3600 * 1000)

  // Marcar allowlist como activada (idempotente).
  await repo.markAllowlistActivated(db, companyId, allowEntry.id, {
    status: 'activated',
    activated_at: activatedAt.toISOString(),
    activated_user_id: userId,
    license_expires_at: licenseExpiresAt.toISOString(),
  })

  // Marcar invitación como aceptada.
  await repo.markInvitationAccepted(db, companyId, email)

  // Consentimiento PII + expiración de plan en el propio perfil.
  await repo.updateOwnProfile(db, userId, {
    pii_consent_at: activatedAt.toISOString(),
    pii_consent_version: PII_CONSENT_VERSION,
    plan_expires_at: licenseExpiresAt.toISOString(),
    email_principal: email,
  })

  // Email de bienvenida branded (best-effort).
  try {
    const co = await repo.getCompanyBrandingById(db, companyId)
    if (co) {
      const FRONT = process.env.FRONTEND_URL || 'https://elvia.lat'
      const sectorPath = co.sector === 'university' ? 'universidades' : 'empresas'
      const loginUrl = `${FRONT}/${sectorPath}/${co.slug}/login`
      await sendBienvenidaActivacionEmail(email, {
        nombre: allowEntry.nombre || '',
        apellido: allowEntry.apellido || '',
        companyName: co.name,
        primaryColor: co.primary_color,
        loginUrl,
        activatedAt,
        licenseExpiresAt,
      })
    }
  } catch (mailErr) {
    console.warn('[confirm-activation] Email bienvenida falló (activación OK igual):', mailErr.message)
  }

  logAudit(db, { company_id: companyId, user_id: userId, action: 'account_activated', entity: 'profiles', entity_id: userId, metadata: { email } })

  return { ok: true }
}

module.exports = {
  DomainError,
  registerBySlug,
  confirmActivation,
  PII_CONSENT_VERSION,
}
