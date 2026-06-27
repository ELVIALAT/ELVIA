// notifications.repository — ÚNICA capa del módulo que toca Supabase.
// Toda query lleva contexto explícito (user_id) para respetar el aislamiento.

/**
 * Trae un CV del usuario para adjuntarlo a un email.
 * Filtra por user_id: un usuario solo puede enviar SUS propios CVs.
 * @param {SupabaseClient} db - cliente con el contexto del request (req.supabase)
 * @param {string} cvId
 * @param {string} userId
 * @returns {Promise<{contenido:string, metadata:object, tipo:string}|null>}
 */
async function getOwnedCv(db, cvId, userId) {
  const { data, error } = await db
    .from('cv_results')
    .select('contenido, metadata, tipo')
    .eq('id', cvId)
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data;
}

module.exports = { getOwnedCv };
