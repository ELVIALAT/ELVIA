// features/career-project/api.js
// Capa de datos del Gerente de Búsqueda / Career Project: encapsula TODO acceso a
// Supabase que antes vivía inline en los componentes. Los componentes ya NO importan
// `supabase` directamente; llaman a careerProjectApi.* y se quedan solo con lógica UI.
//
// Piloto del patrón features/<x>/api.js iniciado en features/cv/api.js.
// El mock de Supabase va en el nivel de módulo (authService) — igual que en cv/api.test.js.
import { supabase } from '../../services/authService'

export const careerProjectApi = {
  /**
   * Comprueba si el usuario ya tiene un CV de tipo 'original' guardado en cv_results.
   * Usado en PilarMiPerfil para saber si habilitar la descarga del CV original.
   *
   * @param {string} userId
   * @returns {Promise<boolean>} true si existe al menos una fila, false si no.
   */
  async tieneCV(userId) {
    const { data } = await supabase
      .from('cv_results')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo', 'original')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data !== null && data !== undefined
  },

  /**
   * Obtiene el id del CV original más reciente del usuario, o null si no existe.
   * Usado en PilarMiPerfil para pasar el id correcto a descargarCV.
   *
   * @param {string} userId
   * @returns {Promise<string|null>}
   */
  async getCVOriginalId(userId) {
    const { data } = await supabase
      .from('cv_results')
      .select('id')
      .eq('user_id', userId)
      .eq('tipo', 'original')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return data?.id ?? null
  },

  /**
   * Obtiene el access_token de la sesión activa de Supabase Auth.
   * Usado en PilarOfertaDeValor para autorizar llamadas al backend.
   *
   * @returns {Promise<string|null>} El access_token si hay sesión, null en caso contrario.
   */
  async getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  },
}
