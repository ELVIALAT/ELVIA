// tenants.repository — ÚNICA capa que toca Supabase para la gestión de tenants
// del super_admin (companies CRUD, perfil HR, logos en Storage).
//
// A diferencia de modules/tenancy (HR con company_id fijo), aquí el super_admin
// opera CROSS-TENANT por diseño: ve y administra TODAS las empresas. No hay un
// companyId para filtrar — la autorización la garantiza requireRole('super_admin')
// en las rutas. Por eso usa supabaseAdmin (service_role) directamente.

const { supabaseAdmin } = require('../../../lib/supabase')

const LOGO_BUCKET = 'tenant-logos'

// ── companies ──────────────────────────────────────────────────────────────

async function listCompanies() {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('*, created_by')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

async function getCompanySlug(companyId) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('slug')
    .eq('id', companyId)
    .single()
  if (error || !data) return null
  return data
}

async function findCompanyBySlug(slug) {
  const { data } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return data || null
}

async function updateCompany(companyId, update) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update(update)
    .eq('id', companyId)
    .select()
    .single()
  if (error) throw error
  return data
}

async function insertCompany(companyData) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert(companyData)
    .select()
    .single()
  if (error) throw error
  return data
}

async function deleteCompany(companyId) {
  return supabaseAdmin.from('companies').delete().eq('id', companyId)
}

// ── Supabase Auth (HR admin) ────────────────────────────────────────────────

async function createHrAuthUser(payload) {
  return supabaseAdmin.auth.admin.createUser(payload)
}

async function deleteAuthUser(userId) {
  return supabaseAdmin.auth.admin.deleteUser(userId)
}

async function generateRecoveryLink(email, redirectTo) {
  return supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })
}

// Perfil del HR admin. UPSERT (no insert): el trigger handle_new_user ya creó
// la fila (id, email_principal) al crear el auth user; un insert puro chocaría
// con profiles_pkey. Ver memoria elvia-supabase-gotchas.
async function upsertHrProfile(profileData) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })
  if (error) throw error
}

// ── Storage (logos) ─────────────────────────────────────────────────────────

async function uploadLogo(path, buffer, contentType) {
  return supabaseAdmin.storage
    .from(LOGO_BUCKET)
    .upload(path, buffer, { contentType, upsert: true, cacheControl: '3600' })
}

function getLogoPublicUrl(path) {
  const { data } = supabaseAdmin.storage.from(LOGO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

module.exports = {
  listCompanies,
  getCompanySlug,
  findCompanyBySlug,
  updateCompany,
  insertCompany,
  deleteCompany,
  createHrAuthUser,
  deleteAuthUser,
  generateRecoveryLink,
  upsertHrProfile,
  uploadLogo,
  getLogoPublicUrl,
}
