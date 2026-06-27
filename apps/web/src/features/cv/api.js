// features/cv/api.js
// Capa de datos de la Factoría CV: encapsula TODO acceso a Supabase (tabla `profiles`
// y Storage `cvs`) que antes vivía inline en useCVWizard.js. El hook ya NO importa
// `supabase`; llama a cvApi.* y se queda solo con estado/efectos/UI.
//
// Es el piloto de la capa `features/<x>/api.js` del plan de Fase 3 (sacar los
// supabase.from( directos de los componentes). Lo protege useCVWizard.persist.test.jsx,
// que mockea `supabase` a nivel de módulo (authService) — el mock sigue valiendo aunque
// quien lo importe sea api.js en vez del hook.
//
// IMPORTANTE — shapes de persistencia intactas (regla CLAUDE.md, no se tocan):
//   profiles.job_search_profile.cv_borrador        = { paso_actual, ultimo_guardado, datos }
//   profiles.job_search_profile.cv_datos_originales = { datos, generado_en }
//   Storage: bucket `cvs`, path `${userId}/cv_original.txt`
import { supabase } from '../../services/authService'

export const cvApi = {
  /**
   * Perfil completo del usuario — fuente de verdad en la carga inicial del wizard.
   * @param {string} userId
   * @returns {Promise<Object|null>} fila de `profiles`, o null si no existe o el select falla.
   */
  async getProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    return data ?? null
  },

  /**
   * Autosave / flush del borrador: read-modify-write sobre job_search_profile.cv_borrador
   * sin pisar el resto del jsp.
   * @param {string} userId
   * @param {{ pasoActual: number, datos: Object }} draft
   * @returns {Promise<{ ok: boolean }>} ok=false si no hay perfil o el update falla; el hook
   *   solo marca "guardado" cuando ok=true.
   */
  async saveDraft(userId, { pasoActual, datos }) {
    const { data: p } = await supabase.from('profiles').select('job_search_profile').eq('id', userId).maybeSingle()
    if (!p) return { ok: false }
    const jsp = p.job_search_profile || {}
    const { error } = await supabase.from('profiles').update({
      job_search_profile: { ...jsp, cv_borrador: { paso_actual: pasoActual, ultimo_guardado: new Date().toISOString(), datos } }
    }).eq('id', userId)
    return { ok: !error }
  },

  /**
   * Descartar borrador: persiste el job_search_profile ya saneado (sin cv_borrador/
   * cv_datos_originales) que arma el hook a partir de borradorPendiente.
   * @param {string} userId
   * @param {Object} newJsp  job_search_profile saneado por el caller.
   * @returns {Promise<void>} El caller envuelve en try/catch (este update no lanza en error
   *   de DB; supabase devuelve { error } que aquí se ignora, igual que el original).
   */
  async discardDraft(userId, newJsp) {
    await supabase.from('profiles').update({ job_search_profile: newJsp }).eq('id', userId)
  },

  /**
   * Guardar CV generado: sube el texto a Storage y persiste cv_path/cv_filename,
   * cv_datos_originales y optimizer.cv_generado=true (mergeado sobre el optimizer
   * existente), limpiando cv_borrador.
   * @param {string} userId
   * @param {{ blob: Blob, filePath: string, nombreArchivo: string, datos: Object }} payload
   * @returns {Promise<string>} el path en Storage. Lanza Error si el upload o el update fallan.
   */
  async saveGeneratedCV(userId, { blob, filePath, nombreArchivo, datos }) {
    // 1. Subir texto generado a Storage
    const { data: up, error: upErr } = await supabase.storage
      .from('cvs').upload(filePath, blob, { upsert: true })
    if (upErr) throw new Error('Error al guardar CV en Storage')

    // 2. Obtener job_search_profile actual para no sobreescribir otros datos
    const { data: pActual } = await supabase.from('profiles')
      .select('job_search_profile')
      .eq('id', userId)
      .maybeSingle()
    const jsp = pActual?.job_search_profile || {}

    // 3. Guardar datos estructurados + limpiar borrador en la DB
    const { cv_borrador, ...restoJsp } = jsp
    const { error: updErr } = await supabase.from('profiles').update({
      cv_path:     up.path,
      cv_filename: nombreArchivo,
      job_search_profile: {
        ...restoJsp,
        cv_datos_originales: { datos, generado_en: new Date().toISOString() },
        optimizer: {
          ...(restoJsp.optimizer || {}),
          cv_generado: true
        }
      }
    }).eq('id', userId)
    if (updErr) throw new Error('Error al actualizar el perfil en la base de datos')

    return up.path
  },
}
