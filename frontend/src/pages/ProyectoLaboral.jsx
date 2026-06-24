// ProyectoLaboral.jsx  — Gerente de Proyecto de tu Búsqueda Laboral
// Design: Plus Jakarta Sans · SaaS Professional · Light mode
import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { extractarPerfilCV, descargarCV } from '../services/cvService'
import ReporteCompensacion from '../components/ReporteCompensacion'
import { useTrackEvent } from '../hooks/useTrackEvent'
import { calcPerfilPts, calcularProgreso as calcProgreso, calcularPorPilar } from '../utils/progresoLaboral'
import {
  Brain, CalendarCheck, Toolbox, FileText,
  Heart, CheckSquare, Square,
  ArrowRight, Trophy, Play, Robot,
  LinkedinLogo, FileMagnifyingGlass, MagnifyingGlass,
  Notepad, PlusMinus, Trash, Target, SpinnerGap,
  CheckCircle, ChartLine, Briefcase,
  User, Lock, Sparkle, MicrophoneStage, Books, Kanban,
  BookmarkSimple, Folders, UsersThree, Globe,
  UploadSimple, CheckFat, WarningCircle, X, CaretDown
} from '@phosphor-icons/react'
import HelpBadge from '../components/common/HelpBadge'
import {
  PILARES, PAISES_LATAM, INDICATIVOS, NIVELES_CARGO, INDUSTRIAS_LATAM,
  AREAS_FUNC, TIPOS_TRABAJO, IDIOMAS_LIST, NIVELES_CEFR, NIVELES_EDUCACION,
  MONEDAS_LIST, MONEDAS_US, MEXICO_DETALLE, CIUDADES_SUGERIDAS, ANIOS_EXP,
  COLORES, DIAS, HORARIOS, PRECIO_OPTIMA_MXN, RECURSOS_DEFAULT,
} from '../features/career-project/constants'
import {
  detectarMoneda, indicativoPorPais, getPrestaciones, soloNumericos,
  formatearMonto, parseMonto, convertirDesdeMXN, sanitizarTexto,
} from '../features/career-project/utils'
import PilarMiPerfil from '../features/career-project/components/PilarMiPerfil'
import DashboardResumen from '../features/career-project/components/DashboardResumen'
import FeaturePreviewGrid from '../features/career-project/components/FeaturePreviewGrid'
import PilarAutoconocimiento from '../features/career-project/components/PilarAutoconocimiento'
import PilarRecursos from '../features/career-project/components/PilarRecursos'
import PilarSemana from '../features/career-project/components/PilarSemana'
import PilarOfertaDeValor from '../features/career-project/components/PilarOfertaDeValor'
import PilarOptimizadorCV from '../features/career-project/components/PilarOptimizadorCV'

/* ─── Design tokens (Plus Jakarta Sans via Google Fonts) ─── */
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap'
if (!document.getElementById('pjs-font')) {
  const link = document.createElement('link')
  link.id   = 'pjs-font'
  link.rel  = 'stylesheet'
  link.href = FONT_LINK
  document.head.appendChild(link)
}

// ─── Cálculo de progreso ─────────────────────────────────────────────────────
// calcPerfilPts y calcularProgreso importados desde utils/progresoLaboral.js
const calcularProgreso = calcProgreso




// ─── Componente Principal ────────────────────────────────────────────────────

export default function ProyectoLaboral() {
  const { user, perfil, refreshPerfil, onboardingPendiente, isPaidPlan, refreshJpData } = useAuth()
  const track = useTrackEvent()
  useEffect(() => { track('page_view', 'proyecto_laboral', { pilar: 'perfil' }) }, [])
  const navigate = useNavigate()
  const location = useLocation()
  const [pilarId,setPilarId] = useState('perfil')
  const [data,setData]       = useState({})
  const [saving,setSaving]   = useState(false)
  const [saved,setSaved]     = useState(false)
  const [justSaved, setJustSaved] = useState(null)  // pilar que acaba de guardarse
  const [modalOfertaIncompleta, setModalOfertaIncompleta] = useState(null) // null | { items, nextPilar }
  const [modalSeccionDesbloqueda, setModalSeccionDesbloqueda] = useState(null) // null | { nextPilarLabel, currentPilarLabel }

  function ofertaIncompletos(oferta) {
    const o = oferta || {}
    const LABELS = {
      ikigai_amas:'¿Qué es lo que AMAS?', ikigai_bueno:'¿Para qué eres BUENO/A?',
      ikigai_necesita:'¿Qué NECESITA el mundo de ti?', ikigai_pagar:'¿Por qué podrían PAGARTE?'
    }
    const items = []
    if (String(o.oferta_valor||'').trim().length<20) items.push('Tu oferta de valor (mínimo 20 caracteres)')
    Object.keys(LABELS).forEach(function(k){ if (String(o[k]||'').trim().length<50) items.push(LABELS[k]+' (mínimo 50 caracteres)') })
    return items
  }

  function pilarIncompletos(pilar, d) {
    const IKIGAI_LABELS = {ikigai_amas:'¿Qué AMAS?',ikigai_bueno:'¿Para qué eres BUENO/A?',ikigai_necesita:'¿Qué NECESITA el mundo?',ikigai_pagar:'¿Por qué te PAGARÍAN?'}
    if (pilar==='autoconocimiento') {
      const a = d.autoconocimiento||{}
      const items=[]
      if (!Array.isArray(a.hard_skills)||a.hard_skills.length<2)   items.push('Hard Skills — selecciona al menos 2')
      if (!Array.isArray(a.soft_skills)||a.soft_skills.length<2)   items.push('Power Skills — selecciona al menos 2')
      return items
    }
    if (pilar==='recursos') {
      const rawArr = d.recursos ? (Array.isArray(d.recursos)?d.recursos:(d.recursos.recursos||[])) : []
      const activos = rawArr.filter(function(r){return r.tengo===true}).length
      return activos<1 ? ['Marca al menos 1 recurso que ya tienes disponible'] : []
    }
    if (pilar==='semana') {
      const bN = Object.values((d.semana&&d.semana.bloques)||{}).filter(Boolean).length
      return bN<1 ? ['Agrega al menos 1 bloque de horas en tu horario semanal'] : []
    }
    if (pilar==='oferta') { return ofertaIncompletos(d.oferta) }
    return []
  }

  function handleSelectPilar(id) {
    if (id!==pilarId) {
      const faltantes = pilarIncompletos(pilarId, data)
      if (faltantes.length>0) {
        const pilarLabel = PILARES.find(function(p){ return p.id===pilarId })?.label || pilarId
        setModalOfertaIncompleta({items:faltantes, nextPilar:id, pilarLabel})
        return
      }
    }
    setPilarId(id)
    track('page_view', 'proyecto_laboral', { pilar: id })
    setTimeout(function(){ pilarCardRef.current&&pilarCardRef.current.scrollIntoView({behavior:'smooth',block:'start'}) },50)
  }
  const [cargando,setCargando] = useState(true)  // estado de carga inicial
  const [errorCarga, setErrorCarga] = useState(null)  // error al cargar datos
  const [bannerCvCreada, setBannerCvCreada] = useState(false)  // banner tras guardar CV
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [modalConfirmInfografia, setModalConfirmInfografia] = useState(false)
  const [generandoReporteComp, setGenerandoReporteComp] = useState(false)
  const pilarCardRef         = useRef(null)
  const saveTimeoutRef       = useRef(null)
  const cvAutoPopuladoRef    = useRef(false)
  const reporteCompRef       = useRef(null)

  const handleClickGenerarInfografia = async () => {
    const ofertaCompleta = porPilar?.oferta === 100
    if (pct < 50 && !ofertaCompleta) {
      alert("Debes completar al menos el 50% de tu Proyecto Laboral o tener tu Oferta de Valor al 100% para generar la infografía ejecutiva. ¡Sigue avanzando!")
      return
    }
    // Verificar si ya tiene una infografía generada
    const { data: existing } = await supabase
      .from('cv_results')
      .select('id')
      .eq('user_id', user.id)
      .eq('tipo', 'optimize')
      .filter('metadata->>subtipo', 'eq', 'infografia_proyecto')
      .limit(1)
    if (existing?.length > 0) {
      setModalConfirmInfografia(true)
    } else {
      generarInfografia()
    }
  }

  const generarInfografia = async () => {
    setModalConfirmInfografia(false)
    setGenerandoPdf(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const res = await fetch(`${apiUrl}/api/cv/infografia-proyecto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }
      })
      const respData = await res.json()
      if (!res.ok) throw new Error(respData.error || 'Error al generar infografía')
      window.open(`/reporte-visual/${respData.id}`, '_blank')
    } catch(e) {
      alert("Error: " + e.message)
    } finally {
      setGenerandoPdf(false)
    }
  }

  // Función genérica de generación PDF → cv_results (upsert por subtipo)
  const generarReportePDF = async ({ elRef, subtipo, filename, contenido }) => {
    const { default: html2pdf } = await import('html2pdf.js')
    const el = elRef.current
    if (!el) return
    const opt = {
      margin: 0, filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
    }
    const pdfBlob = await html2pdf().set(opt).from(el).outputPdf('blob')
    const pdfBase64 = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result.split(',')[1])
      reader.readAsDataURL(pdfBlob)
    })
    const { data: existing } = await supabase.from('cv_results').select('id')
      .eq('user_id', user.id).filter('metadata->>subtipo', 'eq', subtipo).limit(1)
    const payload = { contenido: JSON.stringify(contenido), metadata: { filename, frontend_pdf: true, subtipo, pdf_base64: pdfBase64 } }
    const existingId = existing?.[0]?.id
    if (existingId) {
      await supabase.from('cv_results').update({ contenido: payload.contenido, metadata: payload.metadata }).eq('id', existingId)
    } else {
      await supabase.from('cv_results').insert({ user_id: user.id, tipo: 'optimize', ...payload })
    }
  }

  // Reporte de Compensación — trigger manual desde sub-tab Compensación de Mi Perfil
  const generarReporteCompensacion = async (currentData) => {
    if (!user) return
    setGenerandoReporteComp(true)
    try {
      await generarReportePDF({
        elRef: reporteCompRef,
        subtipo: 'reporte_compensacion',
        filename: 'Reporte de Compensacion.pdf',
        contenido: { perfil: currentData?.perfil || {} },
      })
    } catch (e) {
      console.error('Error generando Reporte de Compensación:', e)
    } finally {
      setGenerandoReporteComp(false)
    }
  }

  // Reporte de Gastos — trigger automático cuando Recursos llega al 100%
  const generarReporteGastos = async (currentData) => {
    if (!user) return
    try {
      await generarReportePDF({
        elRef: reporteCompRef,
        subtipo: 'reporte_gastos',
        filename: 'Reporte de Gastos.pdf',
        contenido: { recursos: currentData?.recursos || {} },
      })
    } catch (e) {
      console.error('Error generando Reporte de Gastos:', e)
    }
  }

  // 1. Carga inicial de datos (sessionStorage -> Supabase)
  useEffect(function(){
    if (!user) return
    let mounted = true
    const CACHE_KEY = `jsp_${user.id}`

    const cargarDatos = async () => {
      // Intento desde caché para velocidad máxima
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached && mounted) {
        try {
          setData(JSON.parse(cached))
          setCargando(false)
        } catch (e) { console.error('Cache corrupto:', e) }
      }

      // Siempre validar contra la DB si no hay caché o si queremos frescura
      try {
        const { data: res, error } = await supabase.from('profiles').select('job_search_profile').eq('id', user.id).maybeSingle()
        if (mounted) {
          if (error) throw error
          if (res?.job_search_profile) {
            setData(res.job_search_profile)
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(res.job_search_profile))
            refreshJpData()
          }
          setCargando(false)
        }
      } catch (err) {
        console.error('Error cargando job_search_profile:', err)
        if (mounted) {
          setErrorCarga('Error al cargar tus datos. Por favor recarga la página.')
          setCargando(false)
        }
      }
    }

    cargarDatos()
    return () => { mounted = false }
    // Depender de user?.id (no de user) para evitar re-cargar y sobrescribir
    // edits en curso cuando el objeto user cambia de referencia (p.ej. al volver
    // a la pestaña tras un refresh de token de Supabase).
  }, [user?.id])

  // 2. Detectar banner de éxito y limpiar URL — solo al montar o cambiar búsqueda
  useEffect(function(){
    const params = new URLSearchParams(location.search)
    if (params.get('exito') === 'cv_creada') {
      setBannerCvCreada(true)
      // Limpiamos la URL sin recargar la página para que el refresh no lo detecte de nuevo
      navigate('/proyecto-laboral', { replace: true })
    }
  }, [location.search, navigate])

  // 3. Auto-poblar perfil si venimos de crear CV y los datos están listos
  useEffect(function(){
    // Solo actuamos si el banner está activo, no estamos cargando, y no lo hemos hecho ya en esta "instancia"
    if (!bannerCvCreada || cargando || !user || !perfil || cvAutoPopuladoRef.current) return
    
    // El lock se pone inmediatamente
    cvAutoPopuladoRef.current = true

    const cvDatos = data?.cv_datos_originales?.datos
    if (!cvDatos) return

    const updates = {}
    // Solo actualizamos lo que esté vacío para no sobreescribir cambios manuales del usuario
    if (!perfil.nombre1    && cvDatos.nombre)     updates.nombre1    = cvDatos.nombre.trim()
    if (!perfil.apellido1  && cvDatos.apellido)   updates.apellido1  = cvDatos.apellido.trim()
    if (!perfil.nombre2    && cvDatos.nombre2)    updates.nombre2    = cvDatos.nombre2.trim()
    if (!perfil.apellido2  && cvDatos.apellido2)  updates.apellido2  = cvDatos.apellido2.trim()
    if (!perfil.telefono1  && cvDatos.telefono)   updates.telefono1  = cvDatos.telefono.trim()
    if (!perfil.ciudad     && cvDatos.ciudad)     updates.ciudad     = cvDatos.ciudad.trim()
    if (!perfil.pais       && cvDatos.pais)       updates.pais       = cvDatos.pais.trim()
    
    // Indicativo especial
    if (!perfil.indicativo1 && (cvDatos.indicativo || cvDatos.pais)) {
      updates.indicativo1 = cvDatos.indicativo || indicativoPorPais(cvDatos.pais)
    }

    // Idiomas (se guardan en job_search_profile.perfil.idiomas)
    const existingJsp = perfil.job_search_profile || {}
    const existingPerfil = existingJsp.perfil || {}
    if ((!existingPerfil.idiomas || existingPerfil.idiomas.length === 0) && cvDatos.idiomas) {
      // Nota: Aquí actualizamos el objeto job_search_profile completo
      const newJsp = {
        ...existingJsp,
        perfil: {
          ...existingPerfil,
          idiomas: cvDatos.idiomas
        }
      }
      updates.job_search_profile = newJsp
    }

    if (Object.keys(updates).length > 0) {
      console.log('Auto-poblando perfil desde CV...', updates)
      // Limpiar caché de perfil para forzar refresco
      sessionStorage.removeItem(`perfil_lp_${user.id}`)
      supabase.from('profiles').update(updates).eq('id', user.id).then(function({ error }){
        if (!error) {
          refreshPerfil() // Refrescar el estado global del perfil
        }
      })
    }
  }, [bannerCvCreada, cargando, user, perfil, data, refreshPerfil])

  const saveData = useCallback(function(nd){
    if (!user) return
    setSaving(true)
    setErrorCarga(null)

    // Sanitizar campos de texto largo antes de guardar (deep-copy oferta para no mutar nd)
    const sanitizedData = { ...nd }
    if (sanitizedData.oferta && sanitizedData.oferta.oferta_valor) {
      sanitizedData.oferta = { ...sanitizedData.oferta, oferta_valor: sanitizarTexto(sanitizedData.oferta.oferta_valor) }
    }

    // Actualizar caché inmediatamente para que al regresar cargue instantáneo
    sessionStorage.setItem(`jsp_${user.id}`, JSON.stringify(sanitizedData))
    supabase.from('profiles').update({job_search_profile:sanitizedData}).eq('id',user.id)
      .then(function(){
        setSaving(false)
        setSaved(true)
        setTimeout(function(){setSaved(false)},2500)
        refreshJpData()  // sincronizar progreso global en AuthContext
      })
      .catch(function(err){
        console.error('Error guardando datos:', err)
        setSaving(false)
        setErrorCarga('Error al guardar. Intenta nuevamente.')
        setTimeout(function(){setErrorCarga(null)},5000)
      })
  },[user])

  // Guarda datos de Mi Perfil directamente en columnas de profiles
  const savePerfil = useCallback(async function(lp, { silent = false } = {}){
    if (!user) return
    // Actualizar caché inmediatamente para carga instantánea al volver al pilar
    sessionStorage.setItem(`perfil_lp_${user.id}`, JSON.stringify(lp))
    setSaving(true)
    const nombreCompleto = [lp.nombre1,lp.nombre2,lp.apellido1,lp.apellido2].map(s=>(s||'').trim()).filter(Boolean).join(' ')
    const salario_esperado = lp.salario_monto ? `${lp.salario_monto} ${lp.moneda||'MXN'}` : ''
    
    // Check old progress of "perfil" before save
    const oldPorPilar = calcularPorPilar(data, perfil)
    const wasComplete = oldPorPilar.perfil === 100

    const { error } = await supabase.from('profiles').update({
      nombre1: lp.nombre1?.trim()||null,
      nombre2: lp.nombre2?.trim()||null,
      apellido1: lp.apellido1?.trim()||null,
      apellido2: lp.apellido2?.trim()||null,
      indicativo1: lp.indicativo1||null,
      telefono1: lp.telefono1?.trim()||null,
      email_secundario: lp.email_secundario?.trim()||null,
      pais: lp.pais||null,
      ciudad: lp.ciudad?.trim()||null,
      edad: lp.edad ? parseInt(lp.edad) : null,
      salario_esperado: salario_esperado||null,
      prestaciones: lp.prestaciones||[],
      nombre: nombreCompleto||null,
      // Compensación detallada
      pais_prestaciones: lp.pais_prestaciones||null,
      prestaciones_detalle: lp.prestaciones_detalle||{},
      bono_activo: lp.bono_activo||false,
      bono_tipo: lp.bono_tipo||null,
      bono_esquema: lp.bono_esquema||null,
      bono_frecuencia: lp.bono_frecuencia||null,
      bono_pct: lp.bono_pct||null,
      bono_num_salarios: lp.bono_num_salarios||null,
      bono_monto: lp.bono_monto||null,
      variable_monto: lp.variable_monto||null,
      prestaciones_otros: lp.prestaciones_otros||null,
    }).eq('id',user.id)
    setSaving(false)
    if (!error) { 
      setSaved(true); 
      setTimeout(()=>setSaved(false),2500); 
      await refreshPerfil()

      // -- CHECK FOR AUTO-ADVANCE COMPLETION --
      const updatedPerfil = {
        ...perfil,
        ...lp,
        salario_esperado,
        prestaciones: lp.prestaciones||[]
      }
      const pData = data || {}
      const porPilarNew = calcularPorPilar(pData, updatedPerfil)
      const currentIdx  = PILARES.findIndex(function(p){ return p.id === 'perfil' })
      const nextPilar   = PILARES[currentIdx + 1]

      if (porPilarNew.perfil === 100 && nextPilar) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setModalSeccionDesbloqueda({
          currentPilarLabel: 'Mi Perfil',
          nextPilarLabel: nextPilar.label,
          nextPilarId: nextPilar.id,
        })
      } else if (!silent) {
        toast.success('Perfil guardado', { duration: 2000 })
      }
    }
  },[user, refreshPerfil, data, perfil])

  const updatePilar = useCallback(function(key,val){
    const nd = Object.assign({},data,{[key]:val})
    setData(nd); saveData(nd)
  },[data,saveData])

  // Callback para PilarMiPerfil: al guardar desde sub-tab Compensación
  // Genera el Reporte de Compensación y muestra el modal de sección con mensaje de reporte
  const handleSaveComp = useCallback(function(){
    const currentIdx = PILARES.findIndex(function(p){ return p.id === 'perfil' })
    const nextPilar  = PILARES[currentIdx + 1]
    setTimeout(() => generarReporteCompensacion(data), 300)
    if (nextPilar) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setModalSeccionDesbloqueda({
        currentPilarLabel: 'Mi Perfil — Compensación',
        nextPilarLabel: nextPilar.label,
        nextPilarId: nextPilar.id,
        reporteGenerado: 'Reporte de Compensación',
      })
    }
  },[data, generarReporteCompensacion])

  const handlePilarSave = useCallback(function(pilarId, updatedPilarData){
    const updatedData = updatedPilarData
      ? { ...data, [pilarId]: updatedPilarData }
      : data

    setJustSaved(pilarId)
    saveData(updatedData)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(function(){ setJustSaved(null) }, 2000)

    // Calcular si el pilar recién guardado llegó a 100%
    const porPilarNew = calcularPorPilar(updatedData, perfil)
    track('pilar_saved', 'proyecto_laboral', { pilar: pilarId, pct: porPilarNew[pilarId] })
    const currentIdx  = PILARES.findIndex(function(p){ return p.id === pilarId })
    const nextPilar   = PILARES[currentIdx + 1]

    if (porPilarNew[pilarId] === 100 && nextPilar) {
      // Scroll al top y mostrar modal de sección desbloqueada
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Si es Recursos (Gastos), generar reporte e incluir mensaje en el modal
      const esGastos = pilarId === 'recursos'
      if (esGastos) setTimeout(() => generarReporteGastos(updatedData), 300)
      setModalSeccionDesbloqueda({
        currentPilarLabel: PILARES[currentIdx].label,
        nextPilarLabel: nextPilar.label,
        nextPilarId: nextPilar.id,
        reporteGenerado: esGastos ? 'Reporte de Gastos' : null,
      })
    } else if (porPilarNew[pilarId] === 100) {
      // Último pilar — toast de felicitaciones
      toast.success('¡Sección completada al 100%! 🎉', { duration: 3000 })
    } else {
      // Guardado parcial — toast simple
      toast.success('Guardado correctamente', { duration: 2000 })
    }
  },[data, saveData, perfil])

  const pct      = calcularProgreso(data, perfil)
  const porPilar = calcularPorPilar(data, perfil)
  const [heroVisible, setHeroVisible] = useState(true)
  const mostrarHeroCompleto = heroVisible
  const pilarObj = PILARES.find(function(p){return p.id===pilarId})||PILARES[0]
  const col      = COLORES[pilarObj.color]||COLORES.violet
  const PilarIcon= pilarObj.icon

  const pctColor = pct>=70?'text-emerald-600':pct>=40?'text-amber-600':'text-violet-700'

  // Auto-colapso del hero al hacer scroll hacia abajo
  useEffect(() => {
    const onScroll = () => { if (window.scrollY > 120) setHeroVisible(false) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Si hay error de carga, mostrar banner
  if (errorCarga && !cargando) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-2xl shadow-lg p-6 border border-red-200 bg-red-50">
          <WarningCircle size={48} weight="fill" className="text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error al cargar tus datos</h2>
          <p className="text-sm text-slate-600 mb-4">{errorCarga}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors"
          >
            Recargar página
          </button>
        </div>
      </div>
    )
  }

  // Si está cargando, mostrar spinner
  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <SpinnerGap size={48} className="text-violet-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Cargando tu información...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

      {/* ══════════ BANNERS DE ESTADO ══════════ */}
      {bannerCvCreada && (
        <div className="bg-emerald-50 border-b border-emerald-200">
          <div className="max-w-5xl mx-auto px-6 md:px-10 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
              <span><strong>¡Tu CV fue guardada!</strong> Hemos pre-llenado tu perfil con la información detectada. Revisa y completa los campos en Mi Perfil.</span>
            </div>
            <button onClick={()=>setBannerCvCreada(false)} className="text-emerald-600 hover:text-emerald-800 shrink-0 cursor-pointer">
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>
      )}
      {errorCarga && (
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-5xl mx-auto px-6 md:px-10 py-3">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <WarningCircle size={18} weight="fill" />
              <span className="font-semibold">{errorCarga}</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ HERO HEADER ══════════ */}
      {!mostrarHeroCompleto && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 py-4 px-6 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            {/* Icono + título */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
                <Target size={16} weight="fill" className="text-violet-300"/>
              </div>
              <span className="text-sm font-black text-white tracking-tight hidden sm:block">Autoconocimiento</span>
            </div>

            {/* Barra de progreso — centrada y más grande */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 w-full max-w-xs">
                <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 80
                        ? 'linear-gradient(90deg,#10b981,#34d399)'
                        : pct >= 40
                        ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                        : 'linear-gradient(90deg,#8b5cf6,#a78bfa)'
                    }}
                  />
                </div>
                <span className="text-sm font-black text-white tabular-nums">{pct}%</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">tu progreso actual</span>
            </div>

            {/* Botón "Ver avance" centrado con animación */}
            <button
              onClick={() => setHeroVisible(true)}
              className="shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-violet-900/50"
              style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
            >
              <span>Ver avance</span>
              <span className="inline-block" style={{ animation: 'bounce-y 1s ease-in-out infinite' }}>↓</span>
            </button>
          </div>

          {/* Keyframes inline para la animación */}
          <style>{`
            @keyframes pulse-glow {
              0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4), 0 4px 24px rgba(139,92,246,0.3); }
              50%       { box-shadow: 0 0 0 6px rgba(139,92,246,0), 0 4px 24px rgba(139,92,246,0.6); }
            }
            @keyframes bounce-y {
              0%, 100% { transform: translateY(0); }
              50%       { transform: translateY(3px); }
            }
          `}</style>
        </div>
      )}
      {mostrarHeroCompleto && <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

            {/* Left: text */}
            <div className="flex-1">
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-200/50 shadow-sm">
                  <Target size={16} weight="fill" className="text-violet-600"/>
                </div>
                <span className="text-[11px] font-black text-violet-600 uppercase tracking-[0.15em]">Marco PMI · Planificación Estratégica</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
                Sé Gerente de Proyecto<br/>
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">de tu Búsqueda Laboral</span>
              </h1>

              <p className="text-slate-500 text-lg leading-relaxed max-w-xl mb-6 font-medium">
                Tómate este tiempo para reflexionar. Deja de lado urgencias y concéntrate en
                entender <span className="font-bold text-slate-800 underline decoration-violet-300 decoration-2 underline-offset-4">muy bien tu propio perfil</span>.
                Es el mejor momento para evaluar, reevaluar y avanzar con una estrategia de última generación.
              </p>

              {/* Stat inline - Premium Glass */}
              <div className="inline-flex items-center gap-3 bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-2xl px-5 py-3.5 group transition-all hover:scale-[1.02]">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-200">73%</div>
                <span className="text-[13px] font-bold text-slate-600 leading-tight max-w-[220px]">de quienes lo completan <span className="text-violet-600">ganan claridad inmediata</span> sobre su oferta de valor</span>
              </div>

              {/* Save indicator */}
              <div className="mt-6 h-6">
                {saving&&<span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold tracking-wide uppercase"><SpinnerGap size={14} className="animate-spin text-violet-500"/> Sincronizando en la nube...</span>}
                {saved &&<span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-100 shadow-sm animate-fade-in"><CheckCircle size={14} weight="fill"/> Guardado Seguro</span>}
              </div>
            </div>

            {/* Right: progress card — World Class Design */}
            <div className="md:w-[340px] shrink-0">
              <div className="relative group overflow-hidden bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/40 border border-slate-800">
                {/* Mesh Gradient Background Effect */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-violet-600/30 blur-[100px] rounded-full group-hover:bg-violet-600/40 transition-colors duration-1000"/>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full group-hover:bg-indigo-600/30 transition-colors duration-1000"/>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estatus General</p>
                    <div className="bg-slate-800/50 backdrop-blur-md rounded-lg px-2 py-1 border border-white/5">
                      <span className="text-[10px] font-bold text-slate-300">FASE 1</span>
                    </div>
                  </div>

                  {/* Circle - Larger and more Premium */}
                  <div className="relative w-36 h-36 mx-auto mb-8 transform group-hover:scale-105 transition-transform duration-700">
                    <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" viewBox="0 0 112 112">
                      <circle cx="56" cy="56" r="48" strokeWidth="10" stroke="#101827" fill="none"/>
                      <circle cx="56" cy="56" r="48" strokeWidth="10"
                        stroke={pct>=80?'#10b981':pct>=50?'#f59e0b':'#8b5cf6'}
                        strokeLinecap="round" fill="none"
                        strokeDasharray={`${2*Math.PI*48}`}
                        strokeDashoffset={`${2*Math.PI*48*(1-pct/100)}`}
                        style={{transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)'}}/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-5xl font-black text-white tracking-tighter">{pct}</span>
                        <span className="text-lg font-black text-white/40">%</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Óptimo</span>
                    </div>
                  </div>

                  {/* High Contrast Legend */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-8 bg-white/5 rounded-2xl p-4 border border-white/5">
                    {[
                      {label:'Perfil',            id:'perfil',           color:'bg-indigo-500'},
                      {label:'Competencias',      id:'autoconocimiento', color:'bg-violet-500'},
                      {label:'Gastos',            id:'recursos',         color:'bg-blue-400'},
                      {label:'Semana',            id:'semana',           color:'bg-teal-400'},
                      {label:'Oferta de Valor',   id:'oferta',           color:'bg-rose-500'},
                      {label:'CV Optimizer',      id:'documentos',       color:'bg-amber-400'},
                    ].map(function(l){
                      const v = porPilar[l.id] || 0
                      return(
                      <div key={l.label} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{l.label}</span>
                          <span className={`text-[11px] font-black ${v>=80?'text-emerald-400':v>=40?'text-amber-400':'text-slate-400'}`}>{v}%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full">
                          <div className={`h-full ${l.color} transition-all duration-1000`} style={{width: v+'%'}}/>
                        </div>
                      </div>
                    )})}
                  </div>

                  {/* Generar PDF Infográfico CTA — Glow Effect */}
                  <button
                    onClick={handleClickGenerarInfografia}
                    disabled={generandoPdf}
                    className="group/btn w-full relative overflow-hidden bg-white text-slate-900 font-black text-xs py-4 rounded-[1.25rem] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] disabled:opacity-50"
                    title={(pct < 50 && porPilar?.oferta !== 100) ? "Requiere 50% de completitud o 100% de Oferta de Valor" : "Genera tu presentación ejecutiva"}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"/>
                    <div className="relative z-10 flex items-center justify-center gap-2 group-hover/btn:text-white transition-colors">
                      {generandoPdf ? <SpinnerGap size={18} className="animate-spin" /> : <Sparkle size={18} weight="fill" className="text-violet-600 group-hover/btn:text-white transition-colors" />}
                      <span className="tracking-widest uppercase">{generandoPdf ? 'Procesando...' : 'Infografía Ejecutiva'}</span>
                    </div>
                  </button>
                  <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest mt-4">
                    Impulsado por Tecnología de Última Generación ELVIA®
                  </p>
                </div>
              </div>
            </div>
          </div>
          {pct > 0 && (
            <div className="max-w-5xl mx-auto px-6 md:px-10 pb-5 flex justify-end">
              <button
                onClick={() => setHeroVisible(false)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-md"
              >
                Ocultar avance ↑
              </button>
            </div>
          )}
        </div>
      </div>}

      {/* ══════════ DASHBOARD RESUMEN ══════════ */}
      <div className="max-w-5xl mx-auto px-4 md:px-10 mt-8">
        <DashboardResumen
          data={data}
          pct={pct}
          onSelect={handleSelectPilar}
          perfil={perfil}
          activePilar={pilarId}
        />
      </div>

      {/* ══════════ CUERPO — Pilares ══════════ */}
      <div className="max-w-5xl mx-auto px-4 md:px-10 mt-6" ref={pilarCardRef}>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-10">
          <div className={'flex items-center gap-3 px-6 py-5 border-b border-slate-100 '+col.header}>
            <PilarIcon size={22} weight="duotone" className={col.icon}/>
            <div>
              <h2 className="font-black text-slate-800 text-lg">{pilarObj.label}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {pilarId==='perfil'          &&'Tu identidad profesional · Datos, compensación y aspiraciones'}
                {pilarId==='autoconocimiento'&&'Competencias · Hard Skills y Power Skills que te definen'}
                {pilarId==='recursos'        &&'Gastos · Inversión real de tu búsqueda laboral'}
                {pilarId==='semana'          &&'Ejecución · Comprométete con el tiempo que dedicarás'}
                {pilarId==='oferta'          &&'Tu propuesta diferencial ★ · Input principal para tu CV de élite'}
                {pilarId==='documentos'      &&'Optimizador de CV · Genera tu CV Inicial en formato Harvard ATS-friendly'}
              </p>
            </div>
          </div>
          <div className="p-6 md:p-8">
            {pilarId==='perfil'        &&<PilarMiPerfil perfil={perfil} extraData={data.perfil} onChange={function(v){updatePilar('perfil',v)}} onSavePerfil={savePerfil} onSaveComp={handleSaveComp} saving={saving} isPaidPlan={isPaidPlan} data={data} userId={user?.id} pct={pct}/>}
            {pilarId==='autoconocimiento'&&<PilarAutoconocimiento data={data.autoconocimiento} onChange={function(v){updatePilar('autoconocimiento',v)}} onSave={function(v){handlePilarSave('autoconocimiento', v)}} justSaved={justSaved==='autoconocimiento'}/>}
            {pilarId==='recursos'      &&<PilarRecursos         data={data.recursos}         onChange={function(v){updatePilar('recursos',v)}} onSave={function(v){handlePilarSave('recursos', v)}} justSaved={justSaved==='recursos'} pais={perfil?.pais_prestaciones || perfil?.pais || ''}/>}
            {pilarId==='semana'        &&<PilarSemana           data={data.semana}           onChange={function(v){updatePilar('semana',v)}} onSave={function(v){handlePilarSave('semana', v)}} justSaved={justSaved==='semana'}/>}
            {pilarId==='oferta'        &&<PilarOfertaDeValor    data={data.oferta}           onChange={function(v){updatePilar('oferta',v)}} onSave={function(v){handlePilarSave('oferta', v)}} justSaved={justSaved==='oferta'} contexto={{hard_skills:data?.autoconocimiento?.hard_skills||[],soft_skills:data?.autoconocimiento?.soft_skills||[],niveles_cargo:data?.perfil?.niveles_cargo||[],areas:data?.perfil?.areas||[]}}/>}
            {pilarId==='documentos'    &&<PilarOptimizadorCV pct={pct}/>}
          </div>
        </div>

        {/* Feature preview grid — solo mientras onboarding pendiente */}
        {onboardingPendiente && (
          <div className="mt-8 mb-10">
            <FeaturePreviewGrid />
          </div>
        )}
      </div>

      {/* ── Modal: navegación con sección incompleta ── */}
      {modalOfertaIncompleta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor:'rgba(15,10,40,0.55)', backdropFilter:'blur(4px)'}}
          onClick={function(e){ if(e.target===e.currentTarget) setModalOfertaIncompleta(null) }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-500 to-rose-600 rounded-t-3xl flex items-center gap-3">
              <WarningCircle size={24} className="text-white" weight="fill"/>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">Sección incompleta</h2>
                <p className="text-rose-100 text-xs mt-0.5">{modalOfertaIncompleta.pilarLabel} tiene campos sin completar</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">Si sales ahora, tu progreso no llegará al 100%. Faltan:</p>
              <ul className="space-y-2 mb-6">
                {modalOfertaIncompleta.items.map(function(item, i){
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">!</span>
                      {item}
                    </li>
                  )
                })}
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={function(){ setModalOfertaIncompleta(null) }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  Volver a completar
                </button>
                <button
                  onClick={function(){
                    const next = modalOfertaIncompleta.nextPilar
                    setModalOfertaIncompleta(null)
                    setPilarId(next)
                    setTimeout(function(){ pilarCardRef.current&&pilarCardRef.current.scrollIntoView({behavior:'smooth',block:'start'}) },50)
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
                >
                  Salir de todas formas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Sección Desbloqueada con Éxito ── */}
      {modalSeccionDesbloqueda && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor:'rgba(15,10,40,0.55)', backdropFilter:'blur(4px)'}}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-5 bg-indigo-600 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Trophy size={20} className="text-white" weight="fill"/>
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">¡Sección completada!</h2>
                <p className="text-indigo-200 text-xs mt-0.5">{modalSeccionDesbloqueda.currentPilarLabel}</p>
              </div>
            </div>
            <div className="px-6 py-6">
              {modalSeccionDesbloqueda.reporteGenerado && (
                <div className="flex gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4">
                  <span className="text-emerald-500 shrink-0 mt-0.5">📄</span>
                  <div>
                    <p className="text-xs font-bold text-emerald-800">Tu {modalSeccionDesbloqueda.reporteGenerado} fue generado</p>
                    <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">Lo encontrarás en <strong>Mis Documentos → Reportes</strong>. Puedes regresar a actualizar esta sección cuando quieras.</p>
                  </div>
                </div>
              )}
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Ahora dirígete a la siguiente sección desbloqueada:
              </p>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-4">
                <p className="text-indigo-700 font-bold text-sm">→ {modalSeccionDesbloqueda.nextPilarLabel}</p>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                No podemos perder tiempo. ¡Vamos con el mínimo viable profesional!
              </p>
              <button
                onClick={function(){
                  const nextId = modalSeccionDesbloqueda.nextPilarId
                  setModalSeccionDesbloqueda(null)
                  handleSelectPilar(nextId)
                }}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors cursor-pointer"
              >
                Ir a {modalSeccionDesbloqueda.nextPilarLabel} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente oculto para captura PDF del Reporte de Compensación */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
        <ReporteCompensacion
          reporteRef={reporteCompRef}
          data={data}
          nombre={perfil?.nombre || [perfil?.nombre1, perfil?.apellido1].filter(Boolean).join(' ') || 'Ejecutivo'}
        />
      </div>

      {/* Modal confirmación: regenerar infografía */}
      {modalConfirmInfografia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">¿Regenerar Infografía?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ya tienes una Infografía de Autoconocimiento guardada</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-5">Al continuar, la infografía anterior será reemplazada con los datos actualizados. Solo se guarda una versión en Mis Documentos.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalConfirmInfografia(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={generarInfografia}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors">
                Sí, regenerar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
