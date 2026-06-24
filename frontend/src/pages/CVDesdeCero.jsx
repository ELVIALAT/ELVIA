// Wizard: Crear CV desde cero (orquestador)
// Fase 3: descompuesto en features/cv/ (1 componente por paso del wizard).
// La lógica de estado, autosave y persistencia (sessionStorage + cv_borrador en BD)
// vive aquí, verbatim — NO tocar shapes de persistencia (regla CLAUDE.md).
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../services/authService'
import { generarCVDesdeCero, extractarPerfilCV, descargarCV, optimizarResumenIA, optimizarExpIA, fusionarResumenIA } from '../services/cvService'
import { SpinnerGap } from '@phosphor-icons/react'
import { ESTADO_EMPTY } from '../features/cv/constants'
import { analizarCalidad, calcularLlenado, generarTipsPorPaso, parseExpYear } from '../features/cv/utils'
import WizardLayout from '../features/cv/components/WizardLayout'
import VistaCVGenerada from '../features/cv/components/VistaCVGenerada'
import PantallaSeleccion from '../features/cv/components/PantallaSeleccion'
import ModalBorradorPendiente from '../features/cv/components/ModalBorradorPendiente'
import AlertaCVExistente from '../features/cv/components/AlertaCVExistente'
import WizardModals from '../features/cv/components/WizardModals'

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CVDesdeCero() {
  const { user, isPaidPlan, perfil, refreshPerfil, refreshJpData } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Modo forzado al entrar desde el Pilar Optimizador de CV
  // 'upload'  → muestra solo upload (pantalla 0 obligatoria)
  // 'scratch' → salta directo al wizard, sin upload
  // null      → comportamiento legacy: pantalla de selección con 2 cards
  const modoForzado = location.state?.mode || null

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [borradorPendiente, setBorradorPendiente] = useState(null) // { datos, paso_actual, p, jsp } cuando hay borrador en BD entrando con mode='scratch'
  const [pasoActual,    setPasoActual]    = useState(0)
  const [datos,         setDatos]         = useState(ESTADO_EMPTY)
  const [generando,     setGenerando]     = useState(false)
  const [cvGenerada,    setCvGenerada]    = useState(null)
  const [error,         setError]         = useState('')
  const [inicializando, setInicializando] = useState(true)
  const [ultimoGuardado,setUltimoGuardado]= useState(null)
  const [extrayendo,    setExtrayendo]    = useState(false)
  const [analisis,      setAnalisis]      = useState(null)
  const [cvMismatch,    setCvMismatch]    = useState(false)
  const [cvPending,     setCvPending]     = useState(null)   // datos extraídos en espera de confirmar
  const [cvFileName,    setCvFileName]    = useState('')
  const [alertaExistente, setAlertaExistente] = useState(false)
  const [modoSeleccion,   setModoSeleccion]   = useState(true)  // false cuando hay borrador o el usuario eligió ruta
  const [optimizandoResumen, setOptimizandoResumen] = useState(false)
  const [resumenSugerido, setResumenSugerido] = useState('')
  const [resumenBloqueado, setResumenBloqueado] = useState(false)
  // Path A — fusión CV + Oferta de Valor
  const [cvResumenOriginal, setCvResumenOriginal] = useState('') // snapshot del resumen extraído del CV (inmutable)
  const [ofertaValorGerente, setOfertaValorGerente] = useState('') // texto Mi Oferta de Valor del Gerente (inmutable)
  const [fusionando, setFusionando] = useState(false)
  const [errorFusion, setErrorFusion] = useState('')
  const [resumenFusionSugerido, setResumenFusionSugerido] = useState('')
  const [cvIdioma, setCvIdioma] = useState('es')         // idioma detectado del CV subido
  const [alertaIdioma, setAlertaIdioma] = useState(false) // modal confirm idioma antes de generar
  const [expSugeridas, setExpSugeridas]   = useState({})  // { [i]: string } sugerencia por exp
  const [expOptimizando, setExpOptimizando] = useState({}) // { [i]: boolean } loading por exp
  const [expMejoradas, setExpMejoradas]   = useState({})  // { [i]: true } botón bloqueado tras aplicar
  const [alertaPlaceholder, setAlertaPlaceholder] = useState(false) // modal placeholder sin reemplazar
  // Fase 4c: contexto estratégico del Gerente de Proyecto para las optimizaciones de IA
  const [contextoGerente, setContextoGerente] = useState(null)
  // Preview editable — snapshot de datos al entrar al paso 6; el usuario edita aquí antes de generar
  const [borradorFinal, setBorradorFinal] = useState(null)
  // Scoring comparativo: score del CV antes de editar (capturado al entrar al paso 6) vs. score final
  const [scoreAntes, setScoreAntes] = useState(null)

  // Al entrar al paso 6 (preview) reinicializar borradorFinal desde datos actuales
  // Si el usuario vuelve al formulario y regresa, sus edits del formulario prevalecen
  useEffect(() => {
    if (pasoActual === 6) {
      const snap = JSON.parse(JSON.stringify(datos))
      setBorradorFinal(snap)
      // Capturar score antes de cualquier edición en el preview
      setScoreAntes(analizarCalidad(snap))
    }
  }, [pasoActual]) // eslint-disable-line react-hooks/exhaustive-deps

  // 1. Verificar si ya tiene CV al cargar
  useEffect(() => {
    if (perfil?.cv_path) {
      setAlertaExistente(true)
    }
  }, [perfil])
  const [nuevaHab,      setNuevaHab]      = useState('')

  // Tips contextuales calculados en tiempo real
  const tipsPorPaso = useMemo(() => generarTipsPorPaso(datos), [datos])

  const saveTimer = useRef(null)
  const fileRef   = useRef(null)
  // Refs para flush en unmount (evitan closure stale)
  const datosRef    = useRef(datos)
  const pasoRef     = useRef(pasoActual)
  const userRef     = useRef(user)
  useEffect(() => { datosRef.current = datos },     [datos])
  useEffect(() => { pasoRef.current  = pasoActual }, [pasoActual])
  useEffect(() => { userRef.current  = user },       [user])

  // ── Pre-llenado desde Perfil + Gerente de Proyecto ──────────────────────────
  // Fuentes (todas dentro de profiles.job_search_profile excepto las marcadas como profile-top-level):
  // - Identidad (nombre, email, etc.) → profiles (top-level)
  // - Cargo objetivo → jsp.perfil.niveles_cargo (array; tomamos el primero como referencia)
  // - Resumen profesional → jsp.oferta.oferta_valor (Mi Oferta de Valor)
  // - Habilidades → jsp.autoconocimiento.hard_skills + soft_skills (Hard + Power Skills, sin duplicados)
  // - Idiomas → jsp.perfil.idiomas (Perfilador del Gerente, NO profiles.idiomas top-level)
  const prefillFromGerente = (p, jsp) => {
    const auto = jsp?.autoconocimiento || {}
    const oferta = jsp?.oferta || {}
    const perfilGerente = jsp?.perfil || {}
    const habGerente = [
      ...(Array.isArray(auto.hard_skills) ? auto.hard_skills : []),
      ...(Array.isArray(auto.soft_skills) ? auto.soft_skills : []),
    ].filter((v, i, a) => a.indexOf(v) === i)

    // Cargo objetivo: primer nivel jerárquico del Perfilador (ej: "Gerente", "Director", "C-Level")
    const cargoFromPerfilador = Array.isArray(perfilGerente.niveles_cargo) && perfilGerente.niveles_cargo.length > 0
      ? perfilGerente.niveles_cargo[0]
      : ''

    // Idiomas: viven en jsp.perfil.idiomas (Perfilador del Gerente)
    const idiomasGerente = Array.isArray(perfilGerente.idiomas) ? perfilGerente.idiomas : []

    return {
      ...ESTADO_EMPTY,
      nombre:        p?.nombre1  || jsp?.nombre1 || '',
      nombre2:       p?.nombre2  || jsp?.nombre2 || '',
      apellido:      p?.apellido1 || jsp?.apellido1 || '',
      apellido2:     p?.apellido2 || jsp?.apellido2 || '',
      email:         p?.email_principal || p?.email || '',
      indicativo:    p?.indicativo1 || jsp?.indicativo1 || '+52',
      telefono:      p?.telefono1 || jsp?.telefono1 || '',
      ciudad:        p?.ciudad   || jsp?.ciudad   || '',
      pais:          p?.pais     || jsp?.pais     || '',
      cargo_objetivo: cargoFromPerfilador,
      resumen:       String(oferta.oferta_valor || '').trim(),
      habilidades:   habGerente,
      idiomas:       idiomasGerente,
    }
  }

  // Decisión sobre borrador en progreso (modal cuando entras con mode='scratch' y ya hay borrador en BD)
  const continuarBorrador = () => {
    if (!borradorPendiente) return
    const { datos: bDatos, paso_actual } = borradorPendiente
    setDatos(bDatos)
    setPasoActual(paso_actual || 0)
    setModoSeleccion(false)
    if (user) sessionStorage.setItem(`cv_draft_${user.id}`, JSON.stringify({ datos: bDatos, paso_actual: paso_actual || 0 }))
    setBorradorPendiente(null)
  }

  const descartarYEmpezar = async () => {
    if (!borradorPendiente || !user) return
    const { p, jsp } = borradorPendiente

    // Borrar cv_borrador + cv_datos_originales en BD
    const newJsp = { ...jsp }
    delete newJsp.cv_borrador
    delete newJsp.cv_datos_originales
    try {
      await supabase.from('profiles').update({ job_search_profile: newJsp }).eq('id', user.id)
    } catch (e) {
      console.error('Error descartando borrador:', e)
    }

    // Limpiar caché local
    sessionStorage.removeItem(`cv_draft_${user.id}`)

    // Pre-llenar fresh
    setDatos(prefillFromGerente(p, jsp))
    setPasoActual(0)
    setModoSeleccion(false)
    setBorradorPendiente(null)
  }

  // ── Carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      if (!user) return
      const CACHE_KEY = `cv_draft_${user.id}`

      // Cuando el usuario viene del Pilar Optimizador con un modo explícito ('scratch' o 'upload'),
      // saltamos el shortcut de sessionStorage. La BD es la fuente de verdad: si hay cv_borrador
      // se carga, si no, se pre-llena desde el perfil y el Gerente. Esto evita que un cache stale
      // (ej. después de borrar datos en BD) bloquee el pre-llenado.
      const ignorarCache = !!modoForzado

      // 1. Carga desde sessionStorage (Solo si tiene datos reales para evitar pisar el perfil con vacíos)
      if (!ignorarCache) {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          try {
            const b = JSON.parse(cached)
            // Solo usar caché si tiene al menos un nombre o si el paso es avanzado
            if (b?.datos && (b.datos.nombre || b.paso_actual > 0)) {
              setDatos(b.datos)
              setPasoActual(b.paso_actual || 0)
              setModoSeleccion(false)
              setInicializando(false)
              return
            }
          } catch { /* ignorar error de parseo */ }
        }
      }

      // 1.5. Si el modo viene forzado desde el Pilar Optimizador de CV
      //   - 'scratch' → salta la pantalla de selección y entra al wizard directo
      //   - 'upload'  → mantiene la pantalla de selección (pantalla 0 obligatoria de upload)
      if (modoForzado === 'scratch') {
        setModoSeleccion(false)
      }

      // 2. Fetch desde Supabase (fuente de verdad)
      try {
        setInicializando(true)
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (!p) return

        const borrador = p?.job_search_profile?.cv_borrador
        const jsp = p?.job_search_profile || {}

        // Capturar Mi Oferta de Valor del Gerente para Path A (fusión con el resumen del CV)
        const ofertaValorTexto = String(jsp?.oferta?.oferta_valor || '').trim()
        setOfertaValorGerente(ofertaValorTexto)

        // Fase 4c: capturar contexto estratégico completo del Gerente para mejorar optimizaciones de IA
        const auto4c = jsp?.autoconocimiento || {}
        const perfil4c = jsp?.perfil || {}
        setContextoGerente({
          oferta_valor:  String(jsp?.oferta?.oferta_valor || '').trim() || null,
          hard_skills:   Array.isArray(auto4c.hard_skills)   ? auto4c.hard_skills   : [],
          soft_skills:   Array.isArray(auto4c.soft_skills)   ? auto4c.soft_skills   : [],
          niveles_cargo: Array.isArray(perfil4c.niveles_cargo) ? perfil4c.niveles_cargo : [],
          areas:         Array.isArray(perfil4c.areas)         ? perfil4c.areas        : [],
          industria:     perfil4c.industria || null,
        })

        if (borrador?.datos && Object.keys(borrador.datos).length > 0) {
          // Hay borrador en BD. Si el usuario entró desde el pilar con mode='scratch',
          // mostramos modal de decisión: continuar borrador vs empezar nuevo.
          // Si entró por link directo (sin mode), cargamos el borrador automáticamente (legacy).
          if (modoForzado === 'scratch') {
            setBorradorPendiente({ datos: borrador.datos, paso_actual: borrador.paso_actual || 0, p, jsp })
          } else {
            setDatos(borrador.datos)
            setPasoActual(borrador.paso_actual || 0)
            setModoSeleccion(false)
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ datos: borrador.datos, paso_actual: borrador.paso_actual || 0 }))
          }
        } else {
          // Si no hay borrador, pre-llenar fresh desde perfil + Gerente
          // Cache local stale: si no hay borrador en BD, el sessionStorage estaría desincronizado.
          // Lo limpiamos para que el próximo unmount no re-escriba datos viejos.
          sessionStorage.removeItem(CACHE_KEY)
          setDatos(prefillFromGerente(p, jsp))
        }
      } catch (e) {
        console.error('Error cargando datos:', e)
        setError('Error al cargar tus datos. Por favor recarga la página.')
      } finally {
        setInicializando(false)
      }
    }
    cargar()
  }, [user, modoForzado])

  // ── Auto-save (todos los usuarios) ─────────────────────────────────────────
  const guardarBorrador = useCallback(() => {
    if (!user) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const { data: p } = await supabase.from('profiles').select('job_search_profile').eq('id', user.id).maybeSingle()
        if (!p) return
        const jsp = p.job_search_profile || {}
        const { error: e } = await supabase.from('profiles').update({
          job_search_profile: { ...jsp, cv_borrador: { paso_actual: pasoActual, ultimo_guardado: new Date().toISOString(), datos } }
        }).eq('id', user.id)
        if (!e) {
          setUltimoGuardado(new Date())
          sessionStorage.setItem(`cv_draft_${user.id}`, JSON.stringify({ datos, paso_actual: pasoActual }))
        }
      } catch (e) { console.error('Error guardando borrador:', e) }
    }, 2000)
  }, [user, isPaidPlan, pasoActual, datos])

  useEffect(() => { guardarBorrador() }, [pasoActual, datos])

  // Flush inmediato al desmontar — evita perder cambios al navegar a otra página
  useEffect(() => {
    return () => {
      if (!userRef.current) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      // Guardar en sessionStorage de forma síncrona (instantáneo)
      sessionStorage.setItem(`cv_draft_${userRef.current.id}`, JSON.stringify({ datos: datosRef.current, paso_actual: pasoRef.current }))
      // Fire-and-forget a Supabase en background
      supabase.from('profiles').select('job_search_profile').eq('id', userRef.current.id).maybeSingle()
        .then(({ data: p }) => {
          if (!p) return
          const jsp = p.job_search_profile || {}
          supabase.from('profiles').update({
            job_search_profile: { ...jsp, cv_borrador: { paso_actual: pasoRef.current, ultimo_guardado: new Date().toISOString(), datos: datosRef.current } }
          }).eq('id', userRef.current.id).then(() => {})
        }).catch(() => {})
    }
  }, [])

  // ── Helpers de estado ───────────────────────────────────────────────────────
  const upDatos = (k, v)           => setDatos(f => ({ ...f, [k]: v }))
  const upExp   = (i, k, v)        => { const a = [...datos.experiencias]; a[i] = { ...a[i], [k]: v }; setDatos(f => ({ ...f, experiencias: a })) }
  const addExp  = ()               => setDatos(f => ({ ...f, experiencias: [{ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }, ...f.experiencias] }))
  const delExp  = (i)              => setDatos(f => ({ ...f, experiencias: f.experiencias.filter((_, j) => j !== i) }))
  const upEdu   = (i, k, v)        => { const a = [...datos.educacion];    a[i] = { ...a[i], [k]: v }; setDatos(f => ({ ...f, educacion: a })) }
  const addEdu  = ()               => setDatos(f => ({ ...f, educacion: [...f.educacion, { institucion: '', titulo: '', anio: '' }] }))
  const delEdu  = (i)              => setDatos(f => ({ ...f, educacion: f.educacion.filter((_, j) => j !== i) }))
  const togHab  = (h)              => setDatos(f => ({ ...f, habilidades: f.habilidades.includes(h) ? f.habilidades.filter(x => x !== h) : [...f.habilidades, h] }))
  const addHab  = (h)              => { if (h && !datos.habilidades.includes(h)) { setDatos(f => ({ ...f, habilidades: [...f.habilidades, h] })); setNuevaHab('') } }
  const togIdm  = (id)             => { const existing = datos.idiomas?.find(i => i.idioma === id); const arr = (datos.idiomas || []).filter(i => i.idioma !== id); if (!existing) arr.push({ idioma: id, nivel: id === 'Español' ? 'Nativo' : null }); setDatos(f => ({ ...f, idiomas: arr })) }
  const upNivIdm = (id, nivel)     => setDatos(f => ({ ...f, idiomas: f.idiomas.map(i => i.idioma === id ? { ...i, nivel } : i) }))

  // ── Aplicar datos extraídos del CV ──────────────────────────────────────────
  const aplicarDatos = (d) => {
    const expArr = Array.isArray(d.experiencias) && d.experiencias.length > 0
      ? d.experiencias
          .map(e => ({ empresa: e.empresa || '', cargo: e.cargo || '', fecha_inicio: e.fecha_inicio || '', fecha_fin: e.fecha_fin || '', descripcion: e.descripcion || '' }))
          .sort((a, b) => parseExpYear(b.fecha_fin) - parseExpYear(a.fecha_fin)) // más reciente primero
      : [{ empresa: '', cargo: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }]

    const eduArr = Array.isArray(d.educacion) && d.educacion.length > 0
      ? d.educacion.map(e => ({ institucion: e.institucion || '', titulo: e.titulo || '', anio: e.anio || '' }))
      : [{ institucion: '', titulo: '', anio: '' }]

    // Normalizar idiomas: strings → {idioma, nivel}. nivel null = usuario elige.
    const IDIOMA_CV_MAP = { es: 'Español', en: 'Inglés', pt: 'Portugués', fr: 'Francés', de: 'Alemán', it: 'Italiano', ja: 'Japonés' }
    const CEFR_VALIDOS = new Set(['Nativo', 'Native', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1'])
    let idiomasNorm = Array.isArray(d.idiomas) && d.idiomas.length > 0
      ? d.idiomas.map(i => {
          if (typeof i === 'string') return { idioma: i, nivel: i === 'Español' ? 'Nativo' : null, detectedFromCV: true }
          const nivelNorm = CEFR_VALIDOS.has(i.nivel) ? i.nivel : (i.nivel === 'Native' ? 'Nativo' : null)
          return { idioma: i.idioma, nivel: nivelNorm, detectedFromCV: true }
        })
      : [...(datos.idiomas || [])]

    // Añadir el idioma del CV como entrada si no está ya en la lista
    const idiomaCvNombre = d.idioma_cv ? IDIOMA_CV_MAP[d.idioma_cv] : null
    if (idiomaCvNombre && !idiomasNorm.some(i => i.idioma === idiomaCvNombre)) {
      idiomasNorm = [{ idioma: idiomaCvNombre, nivel: null, detectedFromCV: true }, ...idiomasNorm]
    }

    // Merge con idiomas del Gerente (Perfilador) — unión sin duplicados
    if (Array.isArray(datos.idiomas)) {
      datos.idiomas.forEach(ig => {
        if (ig?.idioma && !idiomasNorm.some(i => i.idioma === ig.idioma)) {
          idiomasNorm.push(ig)
        }
      })
    }

    // Habilidades: combinar las del CV con las del Gerente (Hard + Power Skills), sin duplicados.
    // Las del Gerente (Competencias del usuario) prevalecen porque son seleccionadas explícitamente.
    const habsCV = Array.isArray(d.habilidades) ? d.habilidades : []
    const habsGerente = Array.isArray(datos.habilidades) ? datos.habilidades : []
    const habsMerged = [...habsGerente, ...habsCV].filter((v, i, a) => a.indexOf(v) === i)

    // Resumen profesional: priorizar el del CV original; si viene vacío, usar Mi Oferta de Valor del Gerente
    const resumenMerged = (d.resumen && String(d.resumen).trim()) || datos.resumen || ''

    const merged = {
      nombre:         d.nombre1    || datos.nombre    || '',
      nombre2:        d.nombre2    || datos.nombre2   || '',
      apellido:       d.apellido1  || datos.apellido  || '',
      apellido2:      d.apellido2  || datos.apellido2 || '',
      email:          datos.email  || '',                          // no sobreescribir el email del registro
      indicativo:     datos.indicativo,
      telefono:       d.telefono1  || d.telefono || datos.telefono  || '',
      ciudad:         d.ciudad     || datos.ciudad    || '',
      pais:           d.pais       || datos.pais      || '',
      cargo_objetivo: d.cargo_actual || datos.cargo_objetivo || '',
      resumen:        resumenMerged,
      experiencias:   expArr,
      educacion:      eduArr,
      habilidades:    habsMerged.length > 0 ? habsMerged : datos.habilidades,
      idiomas:        idiomasNorm,
    }

    // Guardar idioma detectado para usarlo en optimizarResumen y generarCV
    if (d.idioma_cv) setCvIdioma(d.idioma_cv)

    // Path A: capturar snapshot del resumen del CV original (inmutable) para mostrar en la fusión
    setCvResumenOriginal(String(d.resumen || '').trim())

    setDatos(merged)
    setAnalisis(analizarCalidad(merged))
    setCvPending(null)
    setError('')
  }

  // Path A — Fusionar el resumen extraído del CV con la Oferta de Valor del Gerente.
  // El resultado pasa a ser el resumen activo del wizard (datos.resumen).
  const handleFusionarResumen = async () => {
    if (fusionando) return
    if (!cvResumenOriginal && !ofertaValorGerente) {
      setErrorFusion('Necesitas al menos el resumen del CV o tu Oferta de Valor para fusionar.')
      return
    }
    setFusionando(true)
    setErrorFusion('')
    try {
      const res = await fusionarResumenIA(cvResumenOriginal, ofertaValorGerente, cvIdioma || 'es')
      const texto = String(res?.fusionado || '').trim()
      if (!texto) throw new Error('La fusión no devolvió texto.')
      setResumenFusionSugerido(texto)
      setResumenSugerido('') // limpiar optimización normal
      setResumenBloqueado(false)
    } catch (err) {
      console.error('[Fusión] Error:', err)
      setErrorFusion(err?.message || 'No pudimos fusionar el resumen. Intenta de nuevo.')
    } finally {
      setFusionando(false)
    }
  }

  // ── Extracción del CV ────────────────────────────────────────────────────────
  const extraerCV = async (archivo) => {
    if (!archivo) return
    setError('')
    setExtrayendo(true)
    setCvMismatch(false)
    setCvPending(null)
    setCvFileName(archivo.name)

    try {
      const tipos = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!tipos.includes(archivo.type)) throw new Error('Solo se aceptan PDF o Word (.pdf, .doc, .docx)')

      const resultado = await extractarPerfilCV(archivo)
      if (resultado.error) throw new Error(resultado.error)

      // Validación de identidad — doble capa:
      // 1) el backend ya puso mismatch:true si detectó discrepancia
      // 2) fallback frontend: compara con los datos pre-cargados del perfil
      const norm = (s) => (s || '').toLowerCase().trim()
        .normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ')[0]
      const cvN  = norm(resultado.nombre1)
      const cvA  = norm(resultado.apellido1)
      const regN = norm(datos.nombre)    // pre-cargado de Supabase al iniciar
      const regA = norm(datos.apellido)
      const frontendMismatch = (regN && cvN && regN !== cvN) || (regA && cvA && regA !== cvA)

      if (resultado.mismatch || frontendMismatch) {
        setCvMismatch(true)
        setCvPending(resultado)
        return
      }

      aplicarDatos(resultado)
      setModoSeleccion(false)
    } catch (err) {
      setCvFileName('')
      const msg = err?.message || ''
      if (msg.includes('401') || msg.includes('403')) setError('Sesión expirada. Recarga la página e intenta de nuevo.')
      else if (msg.includes('413'))                   setError('El archivo es muy grande. Máximo 5MB.')
      else if (msg.includes('Solo se aceptan'))       setError('Formato no soportado. Sube un PDF o Word (.docx).')
      else                                             setError('No pudimos procesar el CV. Intenta de nuevo.')
    } finally {
      setExtrayendo(false)
    }
  }

  // ── Generar CV con IA ────────────────────────────────────────────────────────
  const generarCV = async (idiomaForzado) => {
    const lang = idiomaForzado || cvIdioma || 'es'
    setAlertaIdioma(false)
    setError('')
    setGenerando(true)
    try {
      const resultado = await generarCVDesdeCero(borradorFinal || datos, lang)
      if (resultado.error) throw new Error(resultado.error)
      setCvGenerada(resultado)
    } catch (err) {
      setError(err.message || 'Error al generar CV')
    } finally {
      setGenerando(false)
    }
  }

  // Si el CV subido está en un idioma distinto al español, pedir confirmación antes de generar
  const iniciarGenerarCV = () => {
    if (cvIdioma && cvIdioma !== 'es') {
      setAlertaIdioma(true)
    } else {
      generarCV('es')
    }
  }

  const handleOptimizarResumen = async () => {
    if (!datos.resumen || datos.resumen.length < 20) {
      setError('Escribe al menos un borrador de tu resumen para optimizarlo.')
      return
    }
    setOptimizandoResumen(true)
    setError('')
    setResumenBloqueado(false)
    try {
      const res = await optimizarResumenIA(datos.resumen, cvIdioma || 'es', contextoGerente)
      console.log('[Debug] Respuesta IA:', res)
      if (res.optimizado) {
        setResumenSugerido(res.optimizado)
      } else {
        console.warn('[Debug] La respuesta no contiene un resumen optimizado:', res)
      }
    } catch (err) {
      console.error('[Debug] Error capturado en handleOptimizarResumen:', err)
      setError(`No pudimos optimizar tu resumen: ${err.message}`)
    } finally {
      setOptimizandoResumen(false)
    }
  }

  const handleOptimizarExp = async (i) => {
    const exp = datos.experiencias[i]
    if (!exp?.descripcion || exp.descripcion.length < 10) return
    setExpOptimizando(prev => ({ ...prev, [i]: true }))
    try {
      const res = await optimizarExpIA(exp.descripcion, exp.cargo, exp.empresa, cvIdioma || 'es', contextoGerente)
      if (res.optimizado) {
        setExpSugeridas(prev => ({ ...prev, [i]: res.optimizado }))
      }
    } catch (err) {
      setError(`No pudimos optimizar la experiencia: ${err.message}`)
    } finally {
      setExpOptimizando(prev => ({ ...prev, [i]: false }))
    }
  }

  const PLACEHOLDER_EXP = /\[[^\]]*[%#]\]|\[X\]|\[N\]|\[XX?\]/i
  const aplicarSugerenciaExp = (i) => {
    const texto = expSugeridas[i] || ''
    if (PLACEHOLDER_EXP.test(texto)) {
      setAlertaPlaceholder(true)
      return
    }
    upExp(i, 'descripcion', texto)
    setExpSugeridas(prev => { const n = { ...prev }; delete n[i]; return n })
    setExpMejoradas(prev => ({ ...prev, [i]: true }))
  }

  const rechazarSugerenciaExp = (i) => {
    setExpSugeridas(prev => { const n = { ...prev }; delete n[i]; return n })
  }

  // ── Confirmar y guardar en BD ─────────────────────────────────────────────
  const confirmarYGuardar = async () => {
    if (!cvGenerada) return
    setGenerando(true)
    setError('')
    try {
      const hoy = new Date()
      const ddmmaa = hoy.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '')
      const src = borradorFinal || datos
      const nombreLimpio = `${src.nombre} ${src.apellido}`.trim() || 'Usuario ELVIA'
      const nombreArchivo = `CV_${nombreLimpio} - original ${ddmmaa}.txt`

      // 1. Subir texto generado a Storage
      const blob = new Blob([cvGenerada.optimizedCV], { type: 'text/plain' })
      const filePath = `${user.id}/cv_original.txt`

      const { data: up, error: upErr } = await supabase.storage
        .from('cvs').upload(filePath, blob, { upsert: true })

      if (upErr) throw new Error('Error al guardar CV en Storage')

      // 2. Usar el ID que ya nos dio el backend al generar
      const savedId = cvGenerada.id;
      if (!savedId) {
        console.warn('Backend no retornó ID, continuando sin vinculación crítica.');
      }

      // 3. Obtener job_search_profile actual para no sobreescribir otros datos
      const { data: pActual } = await supabase.from('profiles')
        .select('job_search_profile')
        .eq('id', user.id)
        .maybeSingle()

      const jsp = pActual?.job_search_profile || {}

      // 4. Guardar datos estructurados + limpiar borrador en la DB
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
      }).eq('id', user.id)

      if (updErr) throw new Error('Error al actualizar el perfil en la base de datos')

      // 4. Limpiar caches locales — ESTO ES CRITICO para que ProyectoLaboral no cargue basura
      sessionStorage.removeItem(`jsp_${user.id}`)
      sessionStorage.removeItem(`cv_draft_${user.id}`)
      sessionStorage.removeItem(`perfil_lp_${user.id}`)

      // 5. Refrescar estado global antes de navegar
      await refreshPerfil()
      if (refreshJpData) await refreshJpData()

      // 6. Navegar al Proyecto Laboral con el flag de éxito
      setCvGenerada(null)
      navigate('/proyecto-laboral?exito=cv_creada', { replace: true })

    } catch (err) {
      console.error('Error en confirmarYGuardar:', err)
      setError(err.message || 'Ocurrió un error inesperado al guardar tu CV.')
    } finally {
      setGenerando(false)
    }
  }

  // ── Vista: CV generado para revisión ─────────────────────────────────────────
  if (cvGenerada) {
    return (
      <VistaCVGenerada
        cvGenerada={cvGenerada}
        setCvGenerada={setCvGenerada}
        borradorFinal={borradorFinal}
        datos={datos}
        scoreAntes={scoreAntes}
        analisis={analisis}
        generando={generando}
        error={error}
        descargarCV={descargarCV}
        confirmarYGuardar={confirmarYGuardar}
      />
    )
  }

  // ── Loading inicial ───────────────────────────────────────────────────────────
  if (inicializando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <SpinnerGap size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Cargando tu información...</p>
        </div>
      </div>
    )
  }

  const pctLlenado = calcularLlenado(datos)

  // Si hay un borrador en BD y el usuario entró con mode='scratch', mostramos solo el modal
  // (sin el wizard ni la pantalla de selección detrás)
  if (borradorPendiente) {
    return (
      <ModalBorradorPendiente
        continuarBorrador={continuarBorrador}
        descartarYEmpezar={descartarYEmpezar}
        setBorradorPendiente={setBorradorPendiente}
        navigate={navigate}
      />
    )
  }

  if (alertaExistente && pasoActual === 0) {
    return <AlertaCVExistente navigate={navigate} setAlertaExistente={setAlertaExistente} />
  }

  // ── Pantalla de selección de ruta ───────────────────────────────────────────
  // - modoForzado='upload'  → solo card de upload (pantalla 0 obligatoria)
  // - modoForzado=null      → comportamiento legacy: 2 cards
  // - modoForzado='scratch' → nunca llega aquí (skip directo en cargar())
  if (!inicializando && modoSeleccion) {
    return (
      <PantallaSeleccion
        modoForzado={modoForzado}
        fileRef={fileRef}
        extraerCV={extraerCV}
        extrayendo={extrayendo}
        error={error}
        setModoSeleccion={setModoSeleccion}
        navigate={navigate}
      />
    )
  }

  return (
    <>
      <WizardLayout
        modoForzado={modoForzado}
        pasoActual={pasoActual}
        setPasoActual={setPasoActual}
        pctLlenado={pctLlenado}
        setShowCancelModal={setShowCancelModal}
        user={user}
        ultimoGuardado={ultimoGuardado}
        analisis={analisis}
        setAnalisis={setAnalisis}
        error={error}
        generando={generando}
        iniciarGenerarCV={iniciarGenerarCV}
        fileRef={fileRef}
        extraerCV={extraerCV}
        cvFileName={cvFileName}
        extrayendo={extrayendo}
        cvMismatch={cvMismatch}
        setCvMismatch={setCvMismatch}
        setCvPending={setCvPending}
        setCvFileName={setCvFileName}
        cvIdioma={cvIdioma}
        datos={datos}
        upDatos={upDatos}
        tipsPorPaso={tipsPorPaso}
        cvResumenOriginal={cvResumenOriginal}
        ofertaValorGerente={ofertaValorGerente}
        handleFusionarResumen={handleFusionarResumen}
        fusionando={fusionando}
        errorFusion={errorFusion}
        resumenFusionSugerido={resumenFusionSugerido}
        setResumenFusionSugerido={setResumenFusionSugerido}
        resumenBloqueado={resumenBloqueado}
        setResumenBloqueado={setResumenBloqueado}
        handleOptimizarResumen={handleOptimizarResumen}
        optimizandoResumen={optimizandoResumen}
        resumenSugerido={resumenSugerido}
        setResumenSugerido={setResumenSugerido}
        delExp={delExp}
        upExp={upExp}
        addExp={addExp}
        handleOptimizarExp={handleOptimizarExp}
        expOptimizando={expOptimizando}
        expSugeridas={expSugeridas}
        expMejoradas={expMejoradas}
        aplicarSugerenciaExp={aplicarSugerenciaExp}
        rechazarSugerenciaExp={rechazarSugerenciaExp}
        setExpSugeridas={setExpSugeridas}
        delEdu={delEdu}
        upEdu={upEdu}
        addEdu={addEdu}
        togHab={togHab}
        nuevaHab={nuevaHab}
        setNuevaHab={setNuevaHab}
        addHab={addHab}
        setDatos={setDatos}
        upNivIdm={upNivIdm}
        togIdm={togIdm}
        borradorFinal={borradorFinal}
        setBorradorFinal={setBorradorFinal}
      />
      <WizardModals
        alertaPlaceholder={alertaPlaceholder}
        setAlertaPlaceholder={setAlertaPlaceholder}
        alertaIdioma={alertaIdioma}
        setAlertaIdioma={setAlertaIdioma}
        cvIdioma={cvIdioma}
        generarCV={generarCV}
        showCancelModal={showCancelModal}
        setShowCancelModal={setShowCancelModal}
        modoForzado={modoForzado}
        user={user}
        navigate={navigate}
      />
    </>
  )
}
