// features/interview/api.js
// Capa de datos del Simulador de Entrevista: encapsula TODO acceso a Supabase
// (tablas `cv_results`, `saved_jobs`, `job_checks` y auth.getSession) que antes
// vivía inline en useEntrevista.js. El hook ya NO importa `supabase`; llama a
// entrevistaApi.* y se queda solo con estado/efectos/UI.
//
// Sigue el patrón piloto de features/cv/api.js.
// Las queries devuelven el array/valor RAW — toda la lógica de filtrado y
// transformación de datos QUEDA en el hook (no en este archivo).
import { supabase } from '../../services/authService'

export const entrevistaApi = {
  /**
   * CV base del usuario: últimos 20 registros tipo 'optimize' u 'original'.
   * La lógica de filtrar SUBTIPOS_EXCLUIDOS y parsear el contenido QUEDA en el hook.
   * @param {string} userId
   * @returns {Promise<{ data: Array }>} data = array de filas (vacío si userId ausente o query falla).
   */
  async getCvBase(userId) {
    if (!userId) return { data: [] }
    const { data } = await supabase
      .from('cv_results')
      .select('id, contenido, tipo, metadata')
      .eq('user_id', userId)
      .in('tipo', ['optimize', 'original'])
      .order('created_at', { ascending: false })
      .limit(20)
    return { data: data || [] }
  },

  /**
   * Vacantes guardadas del usuario + checks de compatibilidad para filtrar por score.
   * El filtrado (score ≥ 75, título disponible, etc.) QUEDA en el hook.
   * @param {string} userId
   * @returns {Promise<{ saved: Array, checks: Array }>}
   *   saved = filas de saved_jobs; checks = filas de job_checks.
   *   Cualquier query que falle devuelve array vacío para la que falló.
   */
  async getVacantesYChecks(userId) {
    if (!userId) return { saved: [], checks: [] }
    const [{ data: saved }, { data: checks }] = await Promise.all([
      supabase
        .from('saved_jobs')
        .select('id, job_data, job_key')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('job_checks')
        .select('job_key, score')
        .eq('user_id', userId),
    ])
    return { saved: saved || [], checks: checks || [] }
  },

  /**
   * Access token de la sesión activa, usado para llamar al endpoint de TTS.
   * El fetch al backend (/api/interview/tts) QUEDA en el hook.
   * @returns {Promise<string|null>} El token de acceso, o null si no hay sesión activa.
   */
  async getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  },
}
