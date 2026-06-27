// features/linkedin/api.js
// Capa de red de LinkedIn Optima: encapsula TODO acceso a supabase.auth.getSession()
// (solo para obtener el Bearer token) y los fetch a /api/linkedin/* que antes vivían
// inline en useLinkedinPro.jsx. El hook ya NO importa `supabase`; llama a linkedinApi.*
// y se queda solo con estado/efectos/UI.
//
// Patrón piloto: features/cv/api.js (solo usa supabase para persistencia en tabla).
// Aquí supabase.auth se usa ÚNICAMENTE como proveedor del token JWT; los datos viven
// íntegramente en el backend (no en profiles ni en Storage).
import { supabase } from '../../services/authService'
import { API } from './constants'

export const linkedinApi = {
  /**
   * Obtiene el Bearer token de la sesión activa.
   * Utilidad interna — también exportada por si algún componente la necesita directamente.
   * @returns {Promise<string|null>}
   */
  async getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  },

  /**
   * Carga inicial: historial de análisis, uso del mes y último análisis guardado.
   * Hace Promise.all de los 3 GETs; si alguno falla devuelve defaults vacíos para
   * esa pieza sin lanzar (la lectura inicial no es crítica).
   * @returns {Promise<{ historial: Array, usoMes: Object, analisisPrevio: Object|null }>}
   */
  async cargarDatos() {
    const token = await linkedinApi.getAccessToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const [resH, resU, resA] = await Promise.all([
      fetch(`${API}/api/linkedin/historial`, { headers }),
      fetch(`${API}/api/linkedin/uso-mes`, { headers }),
      fetch(`${API}/api/linkedin/ultimo-analisis`, { headers }),
    ])

    let historial = []
    let usoMes = { usados: 0, restantes: 10, limite: 10, fecha_reset: null }
    let analisisPrevio = null

    if (resH.ok) {
      try {
        const data = await resH.json()
        historial = Array.isArray(data) ? data : []
      } catch { /* ignorar parse error */ }
    }

    if (resU.ok) {
      try {
        usoMes = await resU.json()
      } catch { /* ignorar parse error */ }
    }

    if (resA.ok) {
      try {
        const a = await resA.json()
        if (a?.original && Object.values(a.original).some(v => v?.trim?.().length > 0)) {
          analisisPrevio = a
        }
      } catch { /* ignorar parse error */ }
    }

    return { historial, usoMes, analisisPrevio }
  },

  /**
   * Extrae los campos del perfil desde un PDF de LinkedIn.
   * @param {File} file  Archivo PDF exportado de LinkedIn.
   * @returns {Promise<{ ok: boolean, data: any, error?: string }>}
   */
  async extraerPDF(file) {
    const token = await linkedinApi.getAccessToken()
    const formData = new FormData()
    formData.append('pdf', file)

    const res = await fetch(`${API}/api/linkedin/extraer-pdf`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    if (!res.ok) {
      let errorMsg = 'No se pudo extraer la información del PDF. Asegúrate de que sea el "Guardar en PDF" de LinkedIn.'
      try {
        const payload = await res.json()
        if (payload?.error) errorMsg = payload.error
      } catch { /* usar mensaje por defecto */ }
      return { ok: false, data: null, error: errorMsg }
    }

    try {
      const data = await res.json()
      return { ok: true, data }
    } catch {
      return { ok: false, data: null, error: 'Respuesta inválida del servidor.' }
    }
  },

  /**
   * Envía los campos del perfil LinkedIn para análisis IA.
   * @param {{ campos: Object, contextoLaboral?: any }} payload
   * @returns {Promise<{ ok: boolean, data: any, error?: string }>}
   */
  async analizar({ campos, contextoLaboral }) {
    const token = await linkedinApi.getAccessToken()

    const res = await fetch(`${API}/api/linkedin/analizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...campos, contextoLaboral }),
    })

    if (!res.ok) {
      try {
        const data = await res.json()
        return { ok: false, data: null, error: data.error || 'Error al analizar el perfil' }
      } catch {
        return { ok: false, data: null, error: 'Error al analizar el perfil' }
      }
    }

    try {
      const data = await res.json()
      return { ok: true, data }
    } catch {
      return { ok: false, data: null, error: 'Respuesta inválida del servidor.' }
    }
  },

  /**
   * Genera un análisis detallado (endpoint separado).
   * Mismo contrato que analizar().
   * @param {{ campos: Object, contextoLaboral?: any }} payload
   * @returns {Promise<{ ok: boolean, data: any, error?: string }>}
   */
  async generateAnalysis({ campos, contextoLaboral }) {
    const token = await linkedinApi.getAccessToken()

    const res = await fetch(`${API}/api/linkedin/generate-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...campos, contextoLaboral }),
    })

    if (!res.ok) {
      try {
        const data = await res.json()
        return { ok: false, data: null, error: data.error || 'Error al generar el análisis' }
      } catch {
        return { ok: false, data: null, error: 'Error al generar el análisis' }
      }
    }

    try {
      const data = await res.json()
      return { ok: true, data }
    } catch {
      return { ok: false, data: null, error: 'Respuesta inválida del servidor.' }
    }
  },

  /**
   * Guarda el informe PDF generado en Mis Documentos del backend.
   * No lanza: si falla, el informe ya fue descargado; solo el registro no se crea.
   * @param {{ analisis: Object, editables: Object, original: Object, filename: string }} payload
   * @returns {Promise<void>}
   */
  async guardarReporte({ analisis, editables, original, filename }) {
    const token = await linkedinApi.getAccessToken()
    if (!token) return
    try {
      await fetch(`${API}/api/linkedin/guardar-reporte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ analisis, editables, original, filename }),
      })
    } catch { /* no crítico: el PDF ya se descargó */ }
  },
}
