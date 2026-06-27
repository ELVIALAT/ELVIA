// cv.repository — ÚNICA capa del módulo que toca Supabase.
// SOLO usa el cliente del request (req.supabase, con contexto del usuario).
// NUNCA usa service_role como fallback (anti-patrón C-3 de la auditoría:
// eso bypasea RLS y convierte un error de seguridad en bypass silencioso).

// Datos de identidad del usuario (para validar el CV contra el perfil).
async function getProfileIdentity(db, userId) {
  const { data } = await db
    .from('profiles')
    .select('nombre1, apellido1')
    .eq('id', userId)
    .single();
  return data || null;
}

// company_id del usuario (para etiquetar cv_results del tenant).
async function getUserCompanyId(db, userId) {
  const { data } = await db
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();
  return data?.company_id || null;
}

// Inserta un cv_result y devuelve su id. Lanza si falla (no fallback a admin).
async function insertCvResult(db, row) {
  const { data, error } = await db.from('cv_results').insert(row).select('id').single();
  if (error) throw error;
  return data?.id;
}

// Trae un cv_result del usuario por id (RLS garantiza que sea suyo).
async function getOwnedCvResult(db, cvId, userId) {
  const { data, error } = await db
    .from('cv_results')
    .select('*')
    .eq('id', cvId)
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data;
}

// CVs recientes del usuario (para selección de contexto, infografías, etc.).
async function getRecentCvResults(db, userId, { tipo, limit = 10 } = {}) {
  let q = db
    .from('cv_results')
    .select('id, contenido, metadata, tipo, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (tipo) q = q.eq('tipo', tipo);
  const { data } = await q;
  return data || [];
}

module.exports = {
  getProfileIdentity,
  getUserCompanyId,
  insertCvResult,
  getOwnedCvResult,
  getRecentCvResults,
};
