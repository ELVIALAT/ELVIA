// identity.repository — ÚNICA capa del módulo identity que toca Supabase.
//
// Aísla las queries de resolución de identidad/rol que ANTES vivían inline en el
// middleware requireAdmin (anti-patrón: middleware con SQL es intesteable y
// acopla la auth al esquema). Extraerlas aquí las hace testeables y reutilizables
// fuera de Express (p.ej. futuros flujos de SSO, account management, jobs).
//
// Las queries de rol reciben `db` (el cliente autenticado del request, con RLS)
// — NO service_role. getUserFromToken usa el cliente base porque ESO es lo que
// autentica (valida la firma del JWT y resuelve el usuario).

const { supabase } = require('../../lib/supabase')

// Valida el JWT vía Supabase Auth → { data: { user }, error }.
async function getUserFromToken(token) {
  return supabase.auth.getUser(token)
}

// Rol de super_admin desde administrators (B2C/global).
async function getAdministratorRole(db, userId) {
  return db.from('administrators').select('role').eq('id', userId).single()
}

// Rol + company_id desde profiles (B2B company_admin).
async function getProfileRole(db, userId) {
  return db.from('profiles').select('role, company_id').eq('id', userId).single()
}

// Flag require_mfa de la empresa (para que requireMFA pueda exigir aal2).
async function getCompanyRequiresMfa(db, companyId) {
  const { data } = await db.from('companies').select('require_mfa').eq('id', companyId).maybeSingle()
  return data?.require_mfa || false
}

module.exports = {
  getUserFromToken,
  getAdministratorRole,
  getProfileRole,
  getCompanyRequiresMfa,
}
