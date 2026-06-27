// linkedin.repository — ÚNICA capa del módulo que toca Supabase.
// Todas las queries llevan user_id explícito (aislamiento por dueño de fila).

// Cuenta análisis del usuario en el mes calendario actual (para el límite mensual).
async function countAnalysesThisMonth(db, userId) {
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);
  const { count, error } = await db
    .from('linkedin_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', inicio.toISOString());
  if (error) {
    console.warn('[linkedin.repo] countAnalysesThisMonth:', error.message);
    return 0;
  }
  return count || 0;
}

// Trae el job_search_profile del usuario (para enriquecer el análisis).
async function getJobSearchProfile(db, userId) {
  const { data } = await db
    .from('profiles')
    .select('job_search_profile')
    .eq('id', userId)
    .maybeSingle();
  return data?.job_search_profile || {};
}

// Trae los CVs recientes del usuario (para extraer titular/resumen de contexto).
async function getRecentCvs(db, userId, limit = 10) {
  const { data } = await db
    .from('cv_results')
    .select('contenido, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// Nombre y apellido del usuario (para validar identidad del PDF).
async function getUserName(db, userId) {
  const { data } = await db
    .from('profiles')
    .select('nombre1, apellido1')
    .eq('id', userId)
    .single();
  return data || null;
}

// Inserta un análisis en el historial (best-effort).
async function insertAnalysis(db, userId, { puntaje_global, resumen_global, top_acciones, secciones, campos_analizados }) {
  const { error } = await db.from('linkedin_analyses').insert({
    user_id: userId,
    puntaje_global,
    resumen_global,
    top_acciones: top_acciones ?? [],
    secciones: secciones ?? {},
    campos_analizados: campos_analizados ?? [],
  });
  if (error) console.error('[linkedin.repo] insertAnalysis:', error.message);
}

// Historial de análisis del usuario (últimos N).
async function getHistory(db, userId, limit = 10) {
  const { data, error } = await db
    .from('linkedin_analyses')
    .select('id, puntaje_global, resumen_global, top_acciones, secciones, campos_analizados, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Último reporte LinkedIn guardado del usuario (en cv_results, subtipo linkedin_analysis).
async function getLatestReport(db, userId) {
  const { data, error } = await db
    .from('cv_results')
    .select('id, contenido, metadata, created_at')
    .eq('user_id', userId)
    .filter('metadata->>subtipo', 'eq', 'linkedin_analysis')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

// UPSERT del reporte: borra el anterior y guarda el nuevo (un registro por usuario).
async function replaceReport(db, userId, { contenido, metadata }) {
  await db
    .from('cv_results')
    .delete()
    .eq('user_id', userId)
    .filter('metadata->>subtipo', 'eq', 'linkedin_analysis');

  const { data, error } = await db
    .from('cv_results')
    .insert({ user_id: userId, tipo: 'optimize', contenido, metadata })
    .select('id')
    .single();
  if (error) throw error;
  return data?.id;
}

module.exports = {
  countAnalysesThisMonth,
  getJobSearchProfile,
  getRecentCvs,
  getUserName,
  insertAnalysis,
  getHistory,
  getLatestReport,
  replaceReport,
};
