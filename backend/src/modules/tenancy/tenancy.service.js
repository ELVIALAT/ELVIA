// tenancy.service — lógica de negocio del HR (company_admin).
//
// Todas las operaciones reciben `companyId` (del req.companyId que pone
// requireRole) y lo propagan al repository, que filtra por él. El service NUNCA
// toca Supabase directamente: solo orquesta repo + emails + audit.
//
// Errores de dominio: DomainError({ status, code, message }) reutilizado del
// registration.service para un manejo HTTP uniforme.

const crypto = require('crypto')
const repo = require('./tenancy.repository')
const logAudit = require('../../lib/logAudit')
const { DomainError } = require('./tenancy.registration.service')
const { sendCandidatoInviteEmail } = require('../../services/resendService')

const ALLOWED_PLANS = ['free', 'pro', 'business', 'enterprise']

// ════════════════════════════════════════════════════════════════════════
// Branding / tenant lookup (público y propio)
// ════════════════════════════════════════════════════════════════════════

async function getPublicCompanyBySlug(db, slug) {
  const company = await repo.getActiveCompanyBySlug(db, slug)
  if (!company) throw new DomainError(404, 'COMPANY_NOT_FOUND', 'Empresa no encontrada')
  return company
}

// Branding del tenant del usuario autenticado. Devuelve null si es B2C.
async function getMyTenant(db, userId) {
  const profile = await repo.getOwnProfile(db, userId, 'company_id, role, cohort')
  if (!profile?.company_id) {
    return { company: null, role: profile?.role || 'user', cohort: profile?.cohort || null }
  }
  const company = await repo.getActiveCompanyById(db, profile.company_id)
  if (!company) {
    return { company: null, role: profile.role, cohort: profile.cohort }
  }
  return { company, role: profile.role, cohort: profile.cohort }
}

// ════════════════════════════════════════════════════════════════════════
// Usuarios del tenant
// ════════════════════════════════════════════════════════════════════════

async function listUsers(db, companyId) {
  return repo.listTenantUsers(db, companyId)
}

async function createUser(db, companyId, { email, nombre, apellido, password }) {
  if (!email) throw new DomainError(400, 'MISSING_EMAIL', 'Email requerido')

  const tempPassword = password || crypto.randomBytes(16).toString('hex')

  // 1. Crear user en auth (sin confirmar).
  const { data: authUser, error: authErr } = await repo.auth.createUser(db, {
    email,
    password: tempPassword,
    email_confirm: false,
  })
  if (authErr) {
    console.error('Auth error:', authErr)
    throw new DomainError(400, 'AUTH_ERROR', authErr.message || 'Error al crear usuario')
  }

  // 2. Crear profile con company_id (vía repo → companyId obligatorio).
  try {
    const profile = await repo.insertTenantProfile(db, companyId, {
      id: authUser.user.id,
      email_principal: email,
      nombre1: nombre || '',
      apellido1: apellido || '',
      role: 'user',
      plan: 'pro', // TODO: obtener del plan actual de la empresa
    })
    return {
      id: profile.id,
      email_principal: profile.email_principal,
      nombre1: profile.nombre1,
      apellido1: profile.apellido1,
    }
  } catch (profileErr) {
    console.error('Profile error:', profileErr)
    await repo.auth.deleteUser(db, authUser.user.id).catch(() => {})
    throw new DomainError(500, 'PROFILE_FAILED', 'Error al crear perfil')
  }
}

async function updateUser(db, companyId, actorUserId, targetId, { nombre, apellido, plan, suspended }) {
  // Validar ownership: el usuario debe pertenecer a esta empresa.
  const user = await repo.getTenantUserById(db, companyId, targetId, 'company_id, plan, suspended')
  if (!user) {
    throw new DomainError(403, 'NO_ACCESS', 'No tienes acceso a este usuario')
  }

  if (plan !== undefined && !ALLOWED_PLANS.includes(plan)) {
    throw new DomainError(400, 'INVALID_PLAN', 'Plan inválido')
  }

  const updateData = {}
  if (nombre !== undefined) updateData.nombre1 = nombre
  if (apellido !== undefined) updateData.apellido1 = apellido
  if (plan !== undefined) updateData.plan = plan
  if (suspended !== undefined) updateData.suspended = suspended

  const updated = await repo.updateTenantUser(db, companyId, targetId, updateData)

  // Audit si cambió plan o suspended (acciones sensibles).
  const auditChanges = {}
  if (plan !== undefined && plan !== user.plan) auditChanges.plan = { from: user.plan, to: plan }
  if (suspended !== undefined && suspended !== user.suspended) auditChanges.suspended = { from: user.suspended, to: suspended }
  if (Object.keys(auditChanges).length > 0) {
    logAudit(db, {
      company_id: companyId,
      user_id: actorUserId,
      action: 'user_updated',
      entity: 'profiles',
      entity_id: targetId,
      metadata: { target_user: targetId, changes: auditChanges },
    }).catch(e => console.error('[Audit] user_updated:', e.message))
  }

  return updated
}

async function deleteUser(db, companyId, actor, targetId) {
  // Validar ownership.
  const user = await repo.getTenantUserById(db, companyId, targetId, 'company_id, email_principal')
  if (!user) {
    throw new DomainError(403, 'NO_ACCESS', 'No tienes acceso a este usuario')
  }

  // Email del auth user (más confiable para el hash GDPR).
  const { data: authUser } = await repo.auth.getUserById(db, targetId)
  const targetEmail = authUser?.user?.email || user.email_principal || ''

  // 1. deletion_audit_log (GDPR — hash SHA256 del email).
  const emailHash = crypto.createHash('sha256').update(targetEmail).digest('hex')
  const emailDomain = targetEmail.split('@')[1] || null
  await repo.insertDeletionAudit(db, {
    deleted_user_id: targetId,
    deleted_user_email_hash: emailHash,
    deleted_user_email_domain: emailDomain,
    admin_id: actor.id,
    admin_email: actor.email || null,
    status: 'pending',
  }).catch(e => console.error('[deletion_audit_log] insert:', e.message))

  // 2. Borrar user de auth (cascade a profile).
  const { error: authErr } = await repo.auth.deleteUser(db, targetId)
  if (authErr) {
    console.error('Auth delete error:', authErr)
    await repo.updateDeletionAuditStatus(db, targetId, { status: 'failed' }).catch(() => {})
    throw new DomainError(500, 'DELETE_FAILED', 'Error al borrar usuario')
  }

  // 3. Marcar deletion_audit_log como completed.
  await repo.updateDeletionAuditStatus(db, targetId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).catch(() => {})

  // 4. tenant_audit_log.
  logAudit(db, {
    company_id: companyId,
    user_id: actor.id,
    action: 'user_removed',
    entity: 'profiles',
    entity_id: targetId,
    metadata: { email_hash: emailHash, email_domain: emailDomain },
  }).catch(e => console.error('[Audit] user_removed:', e.message))
}

// ════════════════════════════════════════════════════════════════════════
// Invitaciones
// ════════════════════════════════════════════════════════════════════════

async function listInvitations(db, companyId) {
  return repo.listInvitations(db, companyId)
}

// Crea (o reusa) la cuenta de un candidato, lo deja en allowlist 'pending',
// genera link de activación (recovery) y envía email branded. Saga con
// múltiples pre-flights de seguridad cross-tenant.
async function createInvitation(db, companyId, actorUserId, payload) {
  const { email, nombre, apellido, telefono, pais, cohort, license_days } = payload
  const emailLower = (email || '').trim().toLowerCase()

  if (!emailLower) throw new DomainError(400, 'MISSING_EMAIL', 'Email requerido')
  if (!nombre) throw new DomainError(400, 'MISSING_NOMBRE', 'Nombre requerido')

  // 1. Datos de la empresa.
  const company = await repo.getCompanyForInviteById(db, companyId)
  if (!company) throw new DomainError(500, 'COMPANY_FETCH_FAILED', 'Error al obtener datos de la empresa')

  // 1.5 Pre-flight: bloquear reinvitar cuentas ya activadas.
  const existingAllow = await repo.getAllowlistByEmail(db, companyId, emailLower, 'status, activated_at')
  if (existingAllow?.status === 'activated') {
    throw new DomainError(409, 'ALREADY_ACTIVATED',
      'Esta cuenta ya está activada. El usuario puede iniciar sesión directamente.')
  }

  // 1.6 Pre-flight: bloquear invitar a admins (defensa contra degradación).
  const existingProfile = await repo.findProfileByEmailGlobal(db, emailLower)
  if (existingProfile && ['super_admin', 'company_admin'].includes(existingProfile.role)) {
    throw new DomainError(409, 'IS_ADMIN',
      'Este email pertenece a un administrador y no puede ser invitado como candidato.')
  }

  // 1.7 Pre-flight: bloquear cross-tenant (email ya vinculado a OTRO programa).
  if (existingProfile?.company_id && existingProfile.company_id !== company.id) {
    throw new DomainError(409, 'CROSS_TENANT_CONFLICT',
      'Este correo ya está registrado en otro programa. Contacta a soporte para resolverlo.')
  }

  const FRONT = process.env.FRONTEND_URL || 'https://elvia.lat'
  const sectorPath = company.sector === 'university' ? 'universidades' : 'empresas'
  const activarUrl = `${FRONT}/${sectorPath}/${company.slug}/activar`
  const loginUrl = `${FRONT}/${sectorPath}/${company.slug}/login`

  // 2. Crear (o recuperar) user en auth sin tocar password/rol si ya existe.
  const { data: authData, error: createErr } = await repo.auth.createUser(db, {
    email: emailLower,
    password: crypto.randomBytes(24).toString('base64url'),
    email_confirm: true,
    user_metadata: { nombre1: nombre.trim(), apellido1: (apellido || '').trim(), company_id: company.id, bienvenida_pendiente: true },
  })

  let authUserId = authData?.user?.id
  const isNewUser = !!authUserId

  if (!authUserId && createErr) {
    const { data: listData } = await repo.auth.listUsers(db, { page: 1, perPage: 1000 })
    const existing = (listData?.users || []).find(u => (u.email || '').toLowerCase() === emailLower)
    if (existing) {
      authUserId = existing.id
      if (!existing.user_metadata?.company_id) {
        await repo.auth.updateUserById(db, authUserId, {
          user_metadata: { ...existing.user_metadata, company_id: company.id },
        })
      }
    }
  }

  // 3. Upsert perfil — para usuarios existentes NO sobreescribir role/plan.
  if (authUserId) {
    const profileData = {
      id: authUserId,
      email_principal: emailLower,
      nombre1: nombre.trim(),
      apellido1: (apellido || '').trim(),
      nombre: `${nombre.trim()} ${(apellido || '').trim()}`.trim(),
      telefono1: telefono || null,
      pais: pais || null,
      cohort: cohort || null,
    }
    if (isNewUser) {
      profileData.role = 'user'
      profileData.plan = 'pro'
    }
    await repo.upsertTenantProfile(db, companyId, profileData)
  }

  // 4. Upsert allowlist como 'pending'.
  await repo.upsertAllowlist(db, companyId, {
    email: emailLower,
    nombre: nombre.trim(),
    apellido: (apellido || '').trim(),
    cohort: cohort || null,
    status: 'pending',
    license_days: Number.isInteger(Number(license_days)) && Number(license_days) > 0 ? Number(license_days) : 90,
  })

  // 5. Link de activación (recovery = setear contraseña por primera vez).
  const { data: linkData, error: linkErr } = await repo.auth.generateLink(db, {
    type: 'recovery',
    email: emailLower,
    options: { redirectTo: activarUrl },
  })
  if (linkErr) {
    console.error('[invite] generateLink error:', linkErr)
    throw new DomainError(500, 'LINK_FAILED', 'No se pudo generar el link de activación')
  }

  // 6. Registrar en company_invitations para trazabilidad.
  await repo.upsertInvitation(db, companyId, {
    email: emailLower,
    nombre: nombre.trim(),
    invited_by: actorUserId,
    status: 'pending',
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
  })

  // 7. Email branded (best-effort).
  try {
    await sendCandidatoInviteEmail(emailLower, {
      nombre,
      apellido: apellido || '',
      companyName: company.name,
      primaryColor: company.primary_color,
      activarUrl: linkData.properties?.action_link || activarUrl,
      hrUrl: loginUrl,
    })
  } catch (mailErr) {
    console.warn('[invite] Email falló (usuario creado igual):', mailErr.message)
  }

  logAudit(db, { company_id: company.id, user_id: actorUserId, action: 'user_invited', entity: 'profiles', entity_id: authUserId, metadata: { email: emailLower, nombre } })

  return { ok: true, message: `Invitación enviada a ${emailLower}` }
}

async function deleteInvitation(db, companyId, id) {
  const inv = await repo.getInvitationById(db, companyId, id)
  if (!inv) {
    throw new DomainError(403, 'NO_ACCESS', 'No tienes acceso a esta invitación')
  }
  await repo.deleteInvitationById(db, companyId, id)
}

// ════════════════════════════════════════════════════════════════════════
// Perfil de empresa
// ════════════════════════════════════════════════════════════════════════

async function getProfile(db, companyId) {
  return repo.getFullCompany(db, companyId)
}

async function updateProfile(db, companyId, { name, country }) {
  const updateData = {}
  if (name) updateData.name = name
  if (country) updateData.country = country
  return repo.updateCompany(db, companyId, updateData)
}

// ════════════════════════════════════════════════════════════════════════
// Dashboard / costos
// ════════════════════════════════════════════════════════════════════════

async function getDashboardStats(db, companyId) {
  const totalUsers = await repo.countTenantUsers(db, companyId)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const activeUsers = await repo.countTenantUsers(db, companyId, { since: thirtyDaysAgo.toISOString() })

  const users = await repo.getTenantUsageRows(db, companyId)
  const totalCVOptimizer = users.reduce((sum, u) => sum + (u.cv_optimizer_count || 0), 0)
  const totalCVMatch = users.reduce((sum, u) => sum + (u.cv_match_count || 0), 0)

  return {
    totalUsers,
    activeUsers,
    adoptionRate: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0,
    cvOptimizerUse: totalCVOptimizer,
    cvMatchUse: totalCVMatch,
  }
}

async function getCosts(db, companyId) {
  const plans = await repo.getCompanyPlans(db, companyId)
  const mentorPkgs = await repo.getMentorPackages(db, companyId)

  const totalPlans = plans.reduce((sum, p) => sum + (p.price_mxn || 0), 0)
  const totalMentor = mentorPkgs.reduce((sum, m) => sum + (m.price_mxn || 0), 0)

  return {
    userPlans: plans,
    mentorPackages: mentorPkgs,
    summary: {
      totalUserPlans: totalPlans,
      totalMentorPackages: totalMentor,
      totalCost: totalPlans + totalMentor,
    },
  }
}

// Exportar reporte de costos (hoy: resumen + envío simulado).
async function exportCosts(db, companyId, { sendEmail, email, fallbackEmail }) {
  const targetEmail = email || fallbackEmail
  const plans = await repo.getCompanyPlans(db, companyId, 'plan_type, price_mxn')
  const totalPlans = plans.reduce((sum, p) => sum + (p.price_mxn || 0), 0)

  // TODO: template real de reporte. Por ahora simulamos el envío.
  void sendEmail

  return {
    message: `Reporte enviado exitosamente a ${targetEmail}`,
    summary: { totalCost: totalPlans, generatedAt: new Date().toISOString() },
  }
}

// ════════════════════════════════════════════════════════════════════════
// Allowlist
// ════════════════════════════════════════════════════════════════════════

async function getAllowlist(db, companyId) {
  return repo.listAllowlist(db, companyId)
}

// Bulk upload de allowlist. Devuelve { processed, upserted, errors, summary }.
async function bulkAllowlist(db, companyId, actorUserId, { rows, cohort_default }) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new DomainError(400, 'EMPTY_ROWS', 'Debes enviar rows[] con al menos una fila.')
  }
  if (rows.length > 5000) {
    throw new DomainError(400, 'TOO_MANY_ROWS', 'Demasiadas filas. Máximo 5000 por carga.')
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const cleaned = []
  const errors = []

  rows.forEach((r, i) => {
    const email = String(r.email || '').trim().toLowerCase()
    if (!email) { errors.push({ row: i + 1, error: 'email vacio' }); return }
    if (!emailRegex.test(email)) { errors.push({ row: i + 1, error: 'email invalido: ' + email }); return }
    const rawDays = parseInt(r.license_days, 10)
    // company_id lo inyecta tenantQuery en el repo; aquí NO lo ponemos a mano.
    cleaned.push({
      email,
      nombre: (r.nombre || '').trim() || null,
      apellido: (r.apellido || '').trim() || null,
      cohort: (r.cohort || cohort_default || '').trim() || null,
      area: (r.area || '').trim() || null,
      cargo_actual: (r.cargo_actual || '').trim() || null,
      license_days: Number.isInteger(rawDays) && rawDays > 0 ? rawDays : 90,
      status: 'pending',
      added_by: actorUserId,
    })
  })

  if (cleaned.length === 0) {
    throw new DomainError(400, 'NO_VALID_ROWS', 'Ninguna fila valida.', errors)
  }

  let inserted
  try {
    inserted = await repo.bulkUpsertAllowlist(db, companyId, cleaned)
  } catch (err) {
    console.error('Allowlist bulk error:', err)
    throw new DomainError(500, 'ALLOWLIST_SAVE_FAILED', 'Error al guardar allowlist: ' + err.message)
  }

  return {
    processed: cleaned.length,
    upserted: inserted.length,
    errors,
    summary: `${cleaned.length} filas procesadas, ${errors.length} con error.`,
  }
}

// Revocar / des-revocar una entrada del allowlist.
async function patchAllowlist(db, companyId, actorUserId, id, action) {
  const row = await repo.getAllowlistById(db, companyId, id, 'id, company_id, status, activated_user_id')
  if (!row) {
    throw new DomainError(403, 'NO_ACCESS', 'No tienes acceso a esta entrada')
  }

  let updates
  if (action === 'revoke') {
    updates = { status: 'revoked', revoked_at: new Date().toISOString(), revoked_by: actorUserId }
    if (row.activated_user_id) {
      try { await repo.setTenantUserSuspended(db, companyId, row.activated_user_id, true) } catch (e) { console.warn('suspend warn:', e.message) }
    }
  } else if (action === 'unrevoke') {
    updates = { status: row.activated_user_id ? 'activated' : 'pending', revoked_at: null, revoked_by: null }
    if (row.activated_user_id) {
      try { await repo.setTenantUserSuspended(db, companyId, row.activated_user_id, false) } catch (e) { console.warn('unsuspend warn:', e.message) }
    }
  } else {
    throw new DomainError(400, 'INVALID_ACTION', 'action debe ser revoke o unrevoke')
  }

  return repo.updateAllowlistById(db, companyId, id, updates)
}

// Borrar entrada del allowlist (hard delete — solo si NO activada).
async function deleteAllowlist(db, companyId, id) {
  const row = await repo.getAllowlistById(db, companyId, id, 'id, company_id, status')
  if (!row) {
    throw new DomainError(403, 'NO_ACCESS', 'No tienes acceso a esta entrada')
  }
  if (row.status === 'activated') {
    throw new DomainError(400, 'CANNOT_DELETE_ACTIVATED', 'No puedes borrar una entrada ya activada. Revocala en su lugar.')
  }
  await repo.deleteAllowlistById(db, companyId, id)
}

module.exports = {
  ALLOWED_PLANS,
  getPublicCompanyBySlug,
  getMyTenant,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listInvitations,
  createInvitation,
  deleteInvitation,
  getProfile,
  updateProfile,
  getDashboardStats,
  getCosts,
  exportCosts,
  getAllowlist,
  bulkAllowlist,
  patchAllowlist,
  deleteAllowlist,
}
