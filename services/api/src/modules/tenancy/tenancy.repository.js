// tenancy.repository — ÚNICA capa del módulo que toca Supabase.
//
// 🔒 REGLA DE ORO (el corazón del aislamiento multi-tenant):
// El cliente service_role BYPASEA RLS. No hay red de seguridad. Por lo tanto:
//   TODA función que opere sobre datos de un tenant DEBE recibir `companyId`
//   como PRIMER parámetro OBLIGATORIO y filtrar por él.
//
// Para garantizarlo usamos tenantQuery(db, companyId), que lanza si companyId
// es falsy y auto-aplica .eq('company_id', companyId) en select/update/delete e
// inyecta company_id en insert/upsert. Olvidar el filtro deja de ser posible.
//
// Funciones SIN contexto de tenant (claramente marcadas con prefijo `public`/
// `auth`/`companyBy*`): operan sobre `companies` (keyed por id o slug, no por
// company_id) o sobre Supabase Auth admin. NO reciben companyId porque la tabla
// no lo tiene; su seguridad se basa en el id/slug exacto + filtros explícitos.

const tenantQuery = require('../../lib/tenantQuery')

// ════════════════════════════════════════════════════════════════════════
// SIN CONTEXTO DE TENANT — companies (por slug o id) y Supabase Auth.
// ════════════════════════════════════════════════════════════════════════

const COMPANY_PUBLIC_FIELDS = `
  id, name, slug, sector, country, is_active,
  logo_url, logo_secondary,
  primary_color, secondary_color, accent_color,
  hero_title, hero_subtitle, hero_image_url, welcome_message,
  contact_email, support_email,
  allowed_email_domain, require_invite,
  branding_mode, show_program_badge, program_badge_text,
  show_pricing, enabled_features
`

const COMPANY_MYTENANT_FIELDS = `
  id, name, slug, sector, country, is_active,
  logo_url, logo_secondary,
  primary_color, secondary_color, accent_color,
  hero_title, hero_subtitle, welcome_message,
  contact_email, support_email,
  require_mfa,
  branding_mode, show_program_badge, program_badge_text,
  show_pricing, enabled_features
`

// Empresa pública por slug (registro/branding). Solo empresas activas.
async function getActiveCompanyBySlug(db, slug) {
  const { data, error } = await db
    .from('companies')
    .select(COMPANY_PUBLIC_FIELDS)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (error || !data) return null
  return data
}

// Empresa activa por id, con los campos que ve el usuario sobre SU tenant.
async function getActiveCompanyById(db, companyId) {
  const { data, error } = await db
    .from('companies')
    .select(COMPANY_MYTENANT_FIELDS)
    .eq('id', companyId)
    .eq('is_active', true)
    .single()
  if (error || !data) return null
  return data
}

// Empresa por slug con los gates de registro (dominio/invite/allowlist).
async function getCompanyGatesBySlug(db, slug) {
  const { data, error } = await db
    .from('companies')
    .select('id, is_active, allowed_email_domain, require_invite, require_allowlist, name')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (error || !data) return null
  return data
}

// Empresa por id (campos para emails de invitación). Sin contexto de tenant
// porque companies se indexa por id, no por company_id.
async function getCompanyForInviteById(db, companyId) {
  const { data, error } = await db
    .from('companies')
    .select('id, name, slug, primary_color, sector')
    .eq('id', companyId)
    .single()
  if (error || !data) return null
  return data
}

// Empresa por id (campos para email de bienvenida).
async function getCompanyBrandingById(db, companyId) {
  const { data } = await db
    .from('companies')
    .select('name, primary_color, slug, sector')
    .eq('id', companyId)
    .maybeSingle()
  return data || null
}

// Perfil completo de empresa (HR ve su propia empresa entera).
async function getFullCompany(db, companyId) {
  const { data, error } = await db
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()
  if (error) throw error
  return data
}

// Actualiza la empresa por id. updateData ya viene saneado por el service.
async function updateCompany(db, companyId, updateData) {
  const { data, error } = await db
    .from('companies')
    .update(updateData)
    .eq('id', companyId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Supabase Auth admin (sin company_id; identidad por email/userId) ──
const auth = {
  createUser: (db, payload) => db.auth.admin.createUser(payload),
  deleteUser: (db, userId) => db.auth.admin.deleteUser(userId),
  getUserById: (db, userId) => db.auth.admin.getUserById(userId),
  updateUserById: (db, userId, attrs) => db.auth.admin.updateUserById(userId, attrs),
  listUsers: (db, opts) => db.auth.admin.listUsers(opts),
  generateLink: (db, payload) => db.auth.admin.generateLink(payload),
}

// ════════════════════════════════════════════════════════════════════════
// CON CONTEXTO DE TENANT — companyId OBLIGATORIO (primer parámetro).
// Todas pasan por tenantQuery, que lanza si companyId falta.
// ════════════════════════════════════════════════════════════════════════

// ── profiles (del tenant) ──

async function listTenantUsers(db, companyId) {
  const tq = tenantQuery(db, companyId)
  const { data, error } = await tq('profiles')
    .select('id, email_principal, nombre1, apellido1, role, plan, suspended, usage_count')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Trae un perfil del tenant por id. Devuelve null si no existe O no pertenece
// a este companyId (aislamiento: el filtro de tenant va en la query).
async function getTenantUserById(db, companyId, userId, fields = 'company_id') {
  const tq = tenantQuery(db, companyId)
  const { data } = await tq('profiles')
    .select(fields)
    .eq('id', userId)
    .maybeSingle()
  return data || null
}

// SIEMPRE upsert sobre profiles (nunca insert puro): un trigger en auth.users
// (handle_new_user) ya crea la fila con (id, email_principal) al registrar el
// auth user. Un insert chocaría con profiles_pkey; el upsert onConflict id
// añade company_id, role, plan y nombres sin pisar lo que puso el trigger.
async function upsertTenantProfile(db, companyId, profileData) {
  const tq = tenantQuery(db, companyId)
  const { data, error } = await tq.upsert('profiles', profileData, { onConflict: 'id' }).select().single()
  if (error) throw error
  return data
}

// Actualiza un perfil DENTRO del tenant. El filtro de company_id (vía tenantQuery)
// impide tocar perfiles de otra empresa aunque el id sea válido.
async function updateTenantUser(db, companyId, userId, updateData) {
  const tq = tenantQuery(db, companyId)
  const { data, error } = await tq('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Conteo de perfiles del tenant; filtros extra opcionales (p.ej. updated_at).
async function countTenantUsers(db, companyId, { since } = {}) {
  const tq = tenantQuery(db, companyId)
  let q = tq('profiles').select('*', { count: 'exact', head: true })
  if (since) q = q.gt('updated_at', since)
  const { count } = await q
  return count || 0
}

// Métricas de utilización agregadas del tenant.
async function getTenantUsageRows(db, companyId) {
  const tq = tenantQuery(db, companyId)
  const { data } = await tq('profiles')
    .select('cv_optimizer_count, cv_match_count, usage_count')
  return data || []
}

// Suspende/reactiva un usuario del tenant (revoke/unrevoke allowlist).
async function setTenantUserSuspended(db, companyId, userId, suspended) {
  const tq = tenantQuery(db, companyId)
  const { error } = await tq('profiles').update({ suspended }).eq('id', userId)
  if (error) throw error
}

// ── profiles SIN contexto de tenant (lookups cross-tenant deliberados) ──
// Usados por pre-flights de invitación que necesitan detectar conflictos
// cross-tenant (un email ya vinculado a OTRA empresa). NO filtran por company_id
// a propósito; el caller compara company_id en la lógica de negocio.

async function findProfileByEmailGlobal(db, email) {
  const { data } = await db
    .from('profiles')
    .select('id, role, email_principal, company_id')
    .eq('email_principal', email)
    .maybeSingle()
  return data || null
}

// Perfil del propio usuario autenticado (my-tenant / confirm-activation).
// Keyed por su userId de sesión — no es dato cross-tenant.
async function getOwnProfile(db, userId, fields = 'company_id, role, cohort') {
  const { data, error } = await db
    .from('profiles')
    .select(fields)
    .eq('id', userId)
    .maybeSingle()
  if (error) return null
  return data || null
}

// Actualiza el perfil del propio usuario (confirm-activation). Keyed por userId.
async function updateOwnProfile(db, userId, updateData) {
  await db.from('profiles').update(updateData).eq('id', userId)
}

// ── company_allowlist (del tenant) ──

async function listAllowlist(db, companyId) {
  const tq = tenantQuery(db, companyId)
  const { data, error } = await tq('company_allowlist')
    .select('id, email, nombre, apellido, cohort, area, cargo_actual, status, added_at, activated_at, activated_user_id, revoked_at, license_days, license_expires_at')
    .order('added_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Entrada de allowlist por email dentro del tenant. ilike para match flexible
// (registro) o eq exacto según el caller; aquí exponemos ilike (case-insensitive).
async function getAllowlistByEmail(db, companyId, email, fields = 'id, status') {
  const tq = tenantQuery(db, companyId)
  const { data } = await tq('company_allowlist')
    .select(fields)
    .ilike('email', email)
    .maybeSingle()
  return data || null
}

// Entrada de allowlist por id dentro del tenant (ownership garantizado por el filtro).
async function getAllowlistById(db, companyId, id, fields = 'id, company_id, status') {
  const tq = tenantQuery(db, companyId)
  const { data } = await tq('company_allowlist')
    .select(fields)
    .eq('id', id)
    .maybeSingle()
  return data || null
}

async function upsertAllowlist(db, companyId, row, opts = { onConflict: 'company_id,email' }) {
  const tq = tenantQuery(db, companyId)
  const { error } = await tq.upsert('company_allowlist', row, opts)
  if (error) throw error
}

// Bulk upsert de allowlist; devuelve filas insertadas (id, email, status).
async function bulkUpsertAllowlist(db, companyId, rows) {
  const tq = tenantQuery(db, companyId)
  const { data, error } = await tq
    .upsert('company_allowlist', rows, { onConflict: 'company_id,email', ignoreDuplicates: false })
    .select('id, email, status')
  if (error) throw error
  return data || []
}

async function updateAllowlistById(db, companyId, id, updates) {
  const tq = tenantQuery(db, companyId)
  const { data, error } = await tq('company_allowlist')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

async function deleteAllowlistById(db, companyId, id) {
  const tq = tenantQuery(db, companyId)
  const { error } = await tq('company_allowlist').delete().eq('id', id)
  if (error) throw error
}

// Marca allowlist como activada (registro/confirm-activation). Por id dentro del tenant.
async function markAllowlistActivated(db, companyId, id, patch) {
  const tq = tenantQuery(db, companyId)
  const { error } = await tq('company_allowlist').update(patch).eq('id', id)
  if (error) throw error
}

// ── company_invitations (del tenant) ──

async function listInvitations(db, companyId) {
  const tq = tenantQuery(db, companyId)
  const { data, error } = await tq('company_invitations')
    .select('id, email, nombre, status, created_at, expires_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// Invitación por token dentro del tenant (registro invite-only).
async function getInvitationByToken(db, companyId, token) {
  const tq = tenantQuery(db, companyId)
  const { data } = await tq('company_invitations')
    .select('id, email, status, expires_at')
    .eq('token', token)
    .maybeSingle()
  return data || null
}

async function getInvitationById(db, companyId, id) {
  const tq = tenantQuery(db, companyId)
  const { data } = await tq('company_invitations')
    .select('company_id')
    .eq('id', id)
    .maybeSingle()
  return data || null
}

async function upsertInvitation(db, companyId, row, opts = { onConflict: 'company_id,email' }) {
  const tq = tenantQuery(db, companyId)
  const { error } = await tq.upsert('company_invitations', row, opts)
  if (error) throw error
}

async function deleteInvitationById(db, companyId, id) {
  const tq = tenantQuery(db, companyId)
  const { error } = await tq('company_invitations').delete().eq('id', id)
  if (error) throw error
}

// Marca invitaciones del tenant como aceptadas por email (confirm-activation).
async function markInvitationAccepted(db, companyId, email) {
  const tq = tenantQuery(db, companyId)
  await tq('company_invitations').update({ status: 'accepted' }).eq('email', email)
}

// ── company_plans / mentor_packages (del tenant) ──

async function getCompanyPlans(db, companyId, fields = 'assigned_to, plan_type, duration_months, price_mxn, assigned_at, expires_at') {
  const tq = tenantQuery(db, companyId)
  const { data, error } = await tq('company_plans').select(fields)
  if (error) throw error
  return data || []
}

async function getMentorPackages(db, companyId) {
  const tq = tenantQuery(db, companyId)
  const { data, error } = await tq('mentor_packages')
    .select('hours, price_mxn, used_hours, purchased_at')
  if (error) throw error
  return data || []
}

// ── deletion_audit_log (del tenant; GDPR) ──
// La tabla no tiene company_id en su flujo original (es global por user). Las
// inserciones se mantienen sin tenantQuery porque se keyean por deleted_user_id,
// pero la autorización ya se validó (el user pertenece al tenant) antes de llamar.

async function insertDeletionAudit(db, row) {
  return db.from('deletion_audit_log').insert(row)
}

async function updateDeletionAuditStatus(db, deletedUserId, patch) {
  return db.from('deletion_audit_log').update(patch).eq('deleted_user_id', deletedUserId)
}

module.exports = {
  // sin tenant
  getActiveCompanyBySlug,
  getActiveCompanyById,
  getCompanyGatesBySlug,
  getCompanyForInviteById,
  getCompanyBrandingById,
  getFullCompany,
  updateCompany,
  auth,
  findProfileByEmailGlobal,
  getOwnProfile,
  updateOwnProfile,
  // con tenant (companyId obligatorio)
  listTenantUsers,
  getTenantUserById,
  upsertTenantProfile,
  updateTenantUser,
  countTenantUsers,
  getTenantUsageRows,
  setTenantUserSuspended,
  listAllowlist,
  getAllowlistByEmail,
  getAllowlistById,
  upsertAllowlist,
  bulkUpsertAllowlist,
  updateAllowlistById,
  deleteAllowlistById,
  markAllowlistActivated,
  listInvitations,
  getInvitationByToken,
  getInvitationById,
  upsertInvitation,
  deleteInvitationById,
  markInvitationAccepted,
  getCompanyPlans,
  getMentorPackages,
  insertDeletionAudit,
  updateDeletionAuditStatus,
}
