// features/linkedin/useLinkedinPro.jsx
// Estado, efectos (carga de historial/uso/último análisis) y handlers (extracción PDF,
// análisis IA, generación de informe PDF con createRoot+html2pdf) de LinkedIn Optima,
// extraídos VERBATIM desde pages/LinkedinPro.jsx. Sin persistencia de browser; datos por
// fetch a /api/linkedin/*. El bloque FeatureLocked (gate por progreso) se reconstruye en
// el orquestador. Renderiza <LinkedinReportePDF/> en handleGenerarInforme → archivo .jsx.
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/authService'
import { calcularProgreso } from '../../utils/progresoLaboral'
import toast from 'react-hot-toast'
import { useTrackEvent } from '../../hooks/useTrackEvent'
import LinkedinReportePDF from '../../components/LinkedinReportePDF'
import { API } from './constants'

export function useLinkedinPro() {
  const { user, jpData, perfil } = useAuth()
  const navigate = useNavigate()
  const track = useTrackEvent()
  useEffect(() => { track('page_view', 'linkedin_pro') }, [])

  // Calcular progreso para el "Progress-based Unlock"
  const proyectoPct = calcularProgreso(jpData || {}, perfil || {})
  const isUnlockedByProgress = proyectoPct >= 100

  const [campos, setCampos] = useState({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' })
  const [importMode, setImportMode] = useState('pdf') // 'pdf' | 'manual'
  const [isExtracting, setIsExtracting] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)
  // Snapshot del texto original que el usuario subió/escribió en el momento del análisis.
  const [originalSnapshot, setOriginalSnapshot] = useState({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' })
  // Textos editables que la IA sugirió por sección — el usuario los modifica antes de pegarlos en LinkedIn.
  const [editables, setEditables] = useState({ titular: '', extracto: '', experiencia: '', habilidades: [], idiomas: '', educacion: '' })
  const [error, setError] = useState('')
  const [historial, setHistorial] = useState([])
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const [generandoInforme, setGenerandoInforme] = useState(false)
  const [informeGenerado, setInformeGenerado] = useState(false)
  const [analisisPrevio, setAnalisisPrevio] = useState(null) // { created_at } del análisis guardado
  const [modalReemplazar, setModalReemplazar] = useState(false)
  // Contador de uso mensual (límite duro de análisis IA por mes calendario).
  const [usoMes, setUsoMes] = useState({ usados: 0, restantes: 10, limite: 10, fecha_reset: null })

  useEffect(() => {
    if (!user) return
    const loadHistorialYUso = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
        const [resH, resU, resA] = await Promise.all([
          fetch(`${API}/api/linkedin/historial`, { headers }),
          fetch(`${API}/api/linkedin/uso-mes`, { headers }),
          fetch(`${API}/api/linkedin/ultimo-analisis`, { headers }),
        ])
        if (resH.ok) {
          const data = await resH.json()
          setHistorial(Array.isArray(data) ? data : [])
        }
        if (resU.ok) {
          const u = await resU.json()
          setUsoMes(u)
        }
        if (resA.ok) {
          const a = await resA.json()
          if (a?.original && Object.values(a.original).some(v => v?.trim?.().length > 0)) {
            // Precargar los campos con el último texto original guardado (silencioso)
            setCampos({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '', ...a.original })
            setImportMode('manual')
            setAnalisisPrevio({ created_at: a.created_at })
          }
        }
      } catch { /* lectura inicial no es crítica */ }
    }
    loadHistorialYUso()
  }, [user])
  const handlePDFUpload = async (file) => {
    if (!file) return
    setIsExtracting(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const formData = new FormData()
      formData.append('pdf', file)

      const res = await fetch(`${API}/api/linkedin/extraer-pdf`, {
        method: 'POST',
        headers: {
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: formData,
      })

      if (!res.ok) {
        // Preferimos el mensaje exacto del backend (incluye instrucciones de descarga si el PDF no coincide).
        let backendMsg = 'No se pudo extraer la información del PDF. Asegúrate de que sea el "Guardar en PDF" de LinkedIn.'
        try {
          const payload = await res.json()
          if (payload?.error) backendMsg = payload.error
        } catch { /* ignoramos parse error y usamos el mensaje por defecto */ }
        throw new Error(backendMsg)
      }
      const data = await res.json()

      setCampos(data)
      setImportMode('manual') // Cambiar a manual para que vean los resultados
      toast.success('¡Perfil importado con éxito!')
    } catch (err) {
      setError(err.message || 'Error al procesar el PDF. Asegúrate de que sea el "Guardar en PDF" de LinkedIn.')
    } finally {
      setIsExtracting(false)
    }
  }

  const camposLlenos = Object.values(campos).some(v => v.trim().length > 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Si hay análisis anterior guardado, pedir confirmación antes de gastar un cupo
    if (analisisPrevio) {
      setModalReemplazar(true)
      return
    }
    return handleLanzarAnalisis()
  }

  const handleLanzarAnalisis = async () => {
    setModalReemplazar(false)
    if (!camposLlenos) return
    setCargando(true)
    setError('')
    setResultado(null)
    track('feature_used', 'linkedin_pro', { action: 'analizar' })

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const res = await fetch(`${API}/api/linkedin/analizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ ...campos, contextoLaboral: jpData }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al analizar el perfil')
      }

      const data = await res.json()
      setResultado(data)

      // Decremento optimista del contador (el backend ya validó antes del análisis).
      setUsoMes(prev => ({
        ...prev,
        usados: (prev.usados || 0) + 1,
        restantes: Math.max(0, (prev.restantes || 0) - 1),
      }))

      // Snapshot del texto original que el usuario tenía en el momento del análisis.
      // Sirve para el botón "Ver mi texto actual" en cada sección editable.
      setOriginalSnapshot({ ...campos })

      // Inicializar editables desde sugerencias_aplicables. Si el backend no las envía
      // (compatibilidad hacia atrás), caemos a `secciones[id].ejemplo` y luego al texto original.
      const sa = data.sugerencias_aplicables || {}
      const secs = data.secciones || {}
      const habilidadesIniciales = (() => {
        if (Array.isArray(sa.habilidades)) return sa.habilidades.filter(Boolean)
        // Fallback: parsear el ejemplo o el texto original separado por coma
        const fuente = sa.habilidades || secs.habilidades?.ejemplo || campos.habilidades || ''
        return String(fuente).split(/[,\n;]+/).map(s => s.trim()).filter(Boolean)
      })()
      const nuevosEditables = {
        titular:     sa.titular     || secs.titular?.ejemplo     || campos.titular     || '',
        extracto:    sa.extracto    || secs.extracto?.ejemplo    || campos.extracto    || '',
        experiencia: sa.experiencia || secs.experiencia?.ejemplo || campos.experiencia || '',
        habilidades: habilidadesIniciales,
        idiomas:     sa.idiomas     || secs.idiomas?.ejemplo     || campos.idiomas     || '',
        educacion:   sa.educacion   || secs.educacion?.ejemplo   || campos.educacion   || '',
      }
      setEditables(nuevosEditables)

      // Agregar al historial local inmediatamente (sin esperar re-fetch)
      const camposUsados = Object.entries(campos).filter(([, v]) => v.trim().length > 0).map(([k]) => k)
      setHistorial(prev => [{
        id: Date.now().toString(),
        puntaje_global: data.puntaje_global,
        resumen_global: data.resumen_global,
        top_acciones: data.top_acciones ?? [],
        secciones: data.secciones ?? {},
        campos_analizados: camposUsados,
        created_at: new Date().toISOString(),
      }, ...prev.slice(0, 9)])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const handleGenerarInforme = async () => {
    if (!resultado) return
    setGenerandoInforme(true)
    try {
      const { default: html2pdf } = await import('html2pdf.js')

      // Renderizar el componente PDF en un div temporal fuera del DOM visible
      const contenedor = document.createElement('div')
      contenedor.style.position = 'fixed'
      contenedor.style.left = '-9999px'
      contenedor.style.top = '0'
      document.body.appendChild(contenedor)

      const root = createRoot(contenedor)
      const fecha = new Date().toISOString().slice(0, 10)
      const nombreArchivo = `Analisis LinkedIn ${fecha}`

      await new Promise(resolve => {
        root.render(
          <LinkedinReportePDF
            analisis={resultado}
            editables={editables}
            original={originalSnapshot}
          />
        )
        // Dar tiempo al render
        setTimeout(resolve, 300)
      })

      await html2pdf().set({
        margin: 8,
        filename: `${nombreArchivo}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(contenedor.firstChild).save()

      root.unmount()
      document.body.removeChild(contenedor)

      // Guardar registro en Mis Documentos
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await fetch(`${API}/api/linkedin/guardar-reporte`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            analisis: resultado,
            editables,
            original: originalSnapshot,
            filename: nombreArchivo,
          }),
        })
      }

      setInformeGenerado(true)
      toast.success('¡Informe creado! Puedes verlo en Mis Documentos', { duration: 5000, icon: '📄' })
    } catch (err) {
      console.error('[generarInforme]', err)
      toast.error('No se pudo generar el informe. Intenta de nuevo.')
    } finally {
      setGenerandoInforme(false)
    }
  }

  const handleReset = () => {
    setResultado(null)
    setCampos({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' })
    setEditables({ titular: '', extracto: '', experiencia: '', habilidades: [], idiomas: '', educacion: '' })
    setOriginalSnapshot({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' })
    setAnalisisPrevio(null)
    setImportMode('pdf')
  }

  // ── API expuesto por context ─────────────────────────────────────────────────
  return {
    // gate / derivados
    isUnlockedByProgress, camposLlenos,
    // base
    user, jpData, navigate,
    // estado
    campos, importMode, isExtracting, cargando, resultado, originalSnapshot, editables,
    error, historial, historialAbierto, generandoInforme, informeGenerado, analisisPrevio,
    modalReemplazar, usoMes,
    // setters consumidos por componentes
    setCampos, setImportMode, setResultado, setEditables, setOriginalSnapshot,
    setHistorialAbierto, setModalReemplazar,
    // handlers
    handlePDFUpload, handleSubmit, handleLanzarAnalisis, handleGenerarInforme,
  }
}
