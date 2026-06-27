// identity.service — lógica de dominio de identidad/autorización.
// Sin dependencias de Express: los middleware (auth, requireRole) son adaptadores
// finos que delegan aquí. Esto hace la resolución de identidad testeable y
// reutilizable a medida que ELVIA escala (SSO, MFA enroll, account management).

const repo = require('./identity.repository')

// Autentica un token JWT. Devuelve { user } o { user: null, error }.
async function authenticate(token) {
  const { data, error } = await repo.getUserFromToken(token)
  if (error || !data?.user) {
    return { user: null, error: error || new Error('Usuario no resuelto') }
  }
  return { user: data.user }
}

// Resuelve el contexto admin de un usuario (réplica fiel de la lógica que vivía
// inline en requireAdmin):
//   1. administrators → super_admin (global).
//   2. profiles → role + company_id (B2B); si tiene company_id, resuelve si la
//      empresa exige MFA.
// Devuelve { role, companyId, profile, mfaRequired }. role=null ⇒ sin acceso.
async function resolveAdminContext(db, userId) {
  // 1. ¿super_admin en administrators?
  const { data: adminRecord, error: adminError } = await repo.getAdministratorRole(db, userId)
  if (!adminError && adminRecord && adminRecord.role === 'super_admin') {
    return { role: 'super_admin', companyId: null, profile: adminRecord, mfaRequired: false }
  }

  // 2. Fallback a profiles (company_admin / user).
  const { data: userProfile, error } = await repo.getProfileRole(db, userId)
  if (!error && userProfile) {
    let mfaRequired = false
    if (userProfile.company_id) {
      mfaRequired = await repo.getCompanyRequiresMfa(db, userProfile.company_id)
    }
    return {
      role: userProfile.role,
      companyId: userProfile.company_id,
      profile: userProfile,
      mfaRequired,
    }
  }

  return { role: null, companyId: null, profile: null, mfaRequired: false }
}

module.exports = { authenticate, resolveAdminContext }
