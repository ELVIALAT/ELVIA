// features/interview/useEntrevista.js
// Estado, refs, efectos (TTS premium OpenAI + fallback navegador, STT/reconocimiento
// de voz, carga de CV base y vacantes) y handlers del Simulador de Entrevista,
// extraídos VERBATIM desde pages/Entrevista.jsx. Persistencia intacta:
// localStorage['entrevista_muted'] y sessionStorage['entrevista_prefill'] (NO tocar).
// EntrevistaApp llama useEntrevista() y provee el resultado por EntrevistaContext.
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../context/ProfileContext'
import { entrevistaApi } from './api'
import { api } from '../../services/api'
import { useTrackEvent } from '../../hooks/useTrackEvent'

export function useEntrevista() {
  const { user } = useAuth()
  const { jpData } = useProfile()
  const navigate = useNavigate()
  const track = useTrackEvent()

  // Paso: 'setup' | 'entrevista' | 'feedback'
  const [paso, setPaso]           = useState('setup')
  const [vacantesGuardadas, setVacantesGuardadas] = useState([])
  const [vacanteSel, setVacanteSel] = useState(null) // vacante seleccionada de guardadas

  // Config
  const [empresa, setEmpresa]             = useState('')
  const [cargo, setCargo]                 = useState('')
  const [entrevistador, setEntrevistador] = useState('HR')
  const [descripcion, setDescripcion]     = useState('')
  const [numPreguntas, setNumPreguntas]   = useState(10)
  const [tipoFeedback, setTipoFeedback]   = useState('final')

  // Entrevista
  const [preguntas, setPreguntas]         = useState([])
  const [preguntaIdx, setPreguntaIdx]     = useState(0)
  const [respuestas, setRespuestas]       = useState([])
  const [inputRespuesta, setInputRespuesta] = useState('')
  const [escuchando, setEscuchando]       = useState(false)
  const [hablando, setHablando]           = useState(false)
  const [muted, setMuted]                 = useState(() => localStorage.getItem('entrevista_muted') === '1')
  const [feedbackInmediato, setFeedbackInmediato] = useState(null)
  const [loadingFeedbackInm, setLoadingFeedbackInm] = useState(false)

  // Estados de carga
  const [loadingPreguntas, setLoadingPreguntas] = useState(false)
  const [loadingEval, setLoadingEval]           = useState(false)
  const [error, setError]                       = useState('')

  // Feedback final
  const [evaluacion, setEvaluacion] = useState(null)
  const [guardadoEnPipeline, setGuardadoEnPipeline] = useState(false)

  const [respuestaCorta, setRespuestaCorta] = useState(false)
  const [confirmSalir, setConfirmSalir]     = useState(false)
  const [activeBrowserTab, setActiveBrowserTab] = useState('chrome')
  const [cvBase, setCvBase]                 = useState('')
  // Brave bloquea Speech Recognition por política de privacidad
  const esBrave = typeof navigator !== 'undefined' && navigator.brave?.isBrave != null
  const recognitionRef = useRef(null)
  const textareaRef    = useRef(null)
  const vocesRef       = useRef([])
  const audioRef       = useRef(null)   // <audio> para la voz premium (OpenAI TTS)

  // Cargar CV Base (tipo=optimize sin subtipo especial) para contexto de entrevista
  useEffect(() => {
    if (!user) return
    const SUBTIPOS_EXCLUIDOS = ['infografia_proyecto', 'linkedin_analysis', 'entrevista_simulada', 'desde_cero']
    entrevistaApi.getCvBase(user.id).then(({ data }) => {
      const base = data.find(r => {
        const subtipo = (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata)?.subtipo
        return !SUBTIPOS_EXCLUIDOS.includes(subtipo) && r.tipo !== 'match'
      })
      if (base?.contenido) {
        try {
          const parsed = typeof base.contenido === 'string' ? JSON.parse(base.contenido) : base.contenido
          const texto = parsed?.contenido_cv || parsed?.cv_text || parsed?.texto || ''
          setCvBase(typeof texto === 'string' ? texto : JSON.stringify(texto))
        } catch {
          if (typeof base.contenido === 'string') setCvBase(base.contenido)
        }
      }
    })
  }, [user])

  // Cargar vacantes guardadas con score ≥ 75 y título disponible
  useEffect(() => {
    if (!user) return
    entrevistaApi.getVacantesYChecks(user.id).then(({ saved, checks }) => {
      const checkMap = {}
      checks.forEach(c => { if (c.job_key) checkMap[c.job_key] = c.score })
      const filtradas = saved
        .filter(s => {
          const titulo = s.job_data?.title
          if (!titulo) return false
          const score = checkMap[s.job_key] ?? checkMap[s.id]
          return score !== undefined && score >= 75
        })
        .map(s => ({ ...s, score: checkMap[s.job_key] ?? checkMap[s.id] }))
      setVacantesGuardadas(filtradas)
    })
  }, [user])

  // Pre-cargar cargo objetivo desde el Gerente de Proyecto
  useEffect(() => {
    const cargoObjetivo = jpData?.perfil?.cargo_objetivo?.trim()
    if (cargoObjetivo) {
      setCargo(prev => prev || cargoObjetivo)
    }
  }, [jpData])

  // 6.1 — Auto-load job description from Pipeline (runs on every mount AND on location change)
  useEffect(() => {
    const prefill = sessionStorage.getItem('entrevista_prefill')
    if (prefill) {
      try {
        const data = JSON.parse(prefill)
        setEmpresa(data.empresa || '')
        setCargo(data.cargo || '')
        setDescripcion(data.descripcion || data.job_data?.full_description || data.job_data?.description || '')
        if (data.jobId) {
          setVacanteSel({ id: data.jobId })
        }
        sessionStorage.removeItem('entrevista_prefill')
      } catch {
        // silently ignore
      }
    }
  }) // sin dependencias → corre en cada render; sessionStorage.removeItem garantiza 1 sola ejecución efectiva

  // Seleccionar vacante guardada
  const seleccionarVacante = (v) => {
    setVacanteSel(v)
    setEmpresa(v.job_data?.company || '')
    setCargo(v.job_data?.title || '')
    setDescripcion(v.job_data?.full_description || v.job_data?.description || v.job_data?.snippet || '')
  }

  // ── Cargar voces disponibles + cleanup de audio al desmontar ────────────
  useEffect(() => {
    const cargarVoces = () => { vocesRef.current = window.speechSynthesis?.getVoices() || [] }
    cargarVoces()
    window.speechSynthesis?.addEventListener('voiceschanged', cargarVoces)
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', cargarVoces)
      try { audioRef.current?.pause() } catch { /* noop */ }
      window.speechSynthesis?.cancel()
    }
  }, [])

  // Toggle mute (persistente en localStorage)
  const toggleMute = () => {
    setMuted(prev => {
      const next = !prev
      localStorage.setItem('entrevista_muted', next ? '1' : '0')
      if (next) detenerVoz()
      return next
    })
  }

  // ── TTS premium (OpenAI) con fallback al navegador ──────────────────────
  // Voz natural del entrevistador vía backend. Si el backend no tiene TTS
  // disponible o falla, cae a la voz neuronal del navegador (leerEnVozBrowser).
  const leerEnVoz = async (texto) => {
    if (muted || !texto) return
    detenerVoz()
    try {
      const accessToken = await entrevistaApi.getAccessToken()
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/interview/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ text: texto }),
      })
      if (!res.ok) throw new Error(`TTS ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onplay  = () => setHablando(true)
      audio.onended = () => { setHablando(false); URL.revokeObjectURL(url) }
      audio.onerror = () => { setHablando(false); URL.revokeObjectURL(url); leerEnVozBrowser(texto) }
      await audio.play()
    } catch {
      // Backend TTS no disponible → fallback a la voz del navegador
      leerEnVozBrowser(texto)
    }
  }

  // Detiene cualquier voz en curso (premium o navegador).
  const detenerVoz = () => {
    try { audioRef.current?.pause(); audioRef.current = null } catch { /* noop */ }
    window.speechSynthesis?.cancel()
    setHablando(false)
  }

  // ── Fallback: voz neuronal del navegador (speechSynthesis) ──────────────
  // Si no hay voz "Natural"/"Google", no habla — silencio > voz robótica.
  const leerEnVozBrowser = (texto) => {
    if (muted) return
    if (!window.speechSynthesis) return
    const voces = vocesRef.current

    const esLatam = v => /es-(MX|US|419|AR|CO|CL|PE)/i.test(v.lang)
    const esNeural = v => /Natural|Online|Neural/i.test(v.name)
    const esGoogle = v => /Google/i.test(v.name)
    const esEspanol = v => /^es/i.test(v.lang)

    const vozBuena =
         voces.find(v => esLatam(v) && esNeural(v))
      || voces.find(v => esLatam(v) && esGoogle(v))
      || voces.find(v => esEspanol(v) && esNeural(v))
      || voces.find(v => esEspanol(v) && esGoogle(v))

    if (!vozBuena) return

    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(texto)
    utt.voice = vozBuena
    utt.lang  = vozBuena.lang
    utt.rate  = 0.95
    utt.pitch = 1.0
    utt.onstart = () => setHablando(true)
    utt.onend   = () => setHablando(false)
    utt.onerror = () => setHablando(false)
    window.speechSynthesis.speak(utt)
  }

  // ── STT: escuchar respuesta del usuario ────────────────────────────────
  const toggleEscucha = async () => {
    if (escuchando) {
      recognitionRef.current?.stop()
      setEscuchando(false)
      return
    }

    setError('')

    try {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) { setError('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.'); return }

      // Verificar permiso explícitamente con getUserMedia — fuerza el popup si es la primera vez
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(t => t.stop())
      } catch (err) {
        setError(`Micrófono inaccesible [${err?.name}]: ${err?.message}. Verifica el permiso en el candado de la barra de dirección y recarga.`)
        return
      }

      // Detener TTS (premium o navegador) antes de escuchar
      detenerVoz()

      const rec = new SR()
      rec.lang = 'es-MX'
      rec.continuous = true
      rec.interimResults = true
      rec.onstart  = () => { setEscuchando(true); setError('') }
      rec.onresult = (e) => {
        let parcial = ''
        let final   = ''
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) final   += e.results[i][0].transcript + ' '
          else                       parcial += e.results[i][0].transcript
        }
        setInputRespuesta(prev => {
          const base = prev.endsWith('…') ? prev.slice(0, -1) : prev
          return (final || (base + parcial)).trim()
        })
      }
      rec.onend   = () => setEscuchando(false)
      rec.onerror = (e) => {
        setEscuchando(false)
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setError('Micrófono bloqueado. Si usas Brave: desactiva Shields para este sitio. En Chrome: candado → Micrófono → Permitir y recarga.')
        } else if (e.error === 'no-speech') {
          setError('No se detectó voz. Asegúrate de hablar cerca del micrófono.')
        } else if (e.error === 'network') {
          setError('Error de red con el servicio de voz. Brave bloquea este servicio — prueba en Chrome o Edge.')
        } else {
          setError(`Error de micrófono [${e.error}]. Prueba en Chrome o Edge.`)
        }
      }
      try {
        rec.start()
        recognitionRef.current = rec
      } catch (err) {
        setEscuchando(false)
        if (err?.name === 'InvalidStateError') {
          recognitionRef.current?.stop()
          setError('El micrófono ya estaba activo. Intenta de nuevo.')
        } else {
          setError(`No se pudo iniciar el micrófono [${err?.name}]: ${err?.message}`)
        }
      }
    } catch (err) {
      setEscuchando(false)
      setError(`Error inesperado [${err?.name}]: ${err?.message}`)
    }
  }

  // ── Generar preguntas ──────────────────────────────────────────────────
  const iniciarEntrevista = async () => {
    if (!cargo.trim()) { setError('Escribe el cargo para continuar'); return }
    setError('')
    setLoadingPreguntas(true)
    track('feature_used', 'entrevista', { cargo, entrevistador })
    try {
      const { preguntas: qs } = await api.post('/api/interview/preguntas', {
        empresa, cargo, entrevistador, descripcion, numPreguntas,
        ...(cvBase ? { cv_base: cvBase } : {}),
      })
      setPreguntas(qs)
      setRespuestas(new Array(qs.length).fill(''))
      setPreguntaIdx(0)
      setFeedbackInmediato(null)
      setPaso('entrevista')
      setTimeout(() => leerEnVoz(qs[0].pregunta), 600)
    } catch {
      setError('Error al generar las preguntas. Intenta de nuevo.')
    } finally {
      setLoadingPreguntas(false)
    }
  }

  // ── Validar respuesta antes de avanzar ────────────────────────────────
  const MIN_CHARS = 30
  const validarRespuesta = () => {
    const txt = inputRespuesta.trim()
    if (!txt) { setError('Debes responder antes de continuar.'); return false }
    if (txt.length < MIN_CHARS) { setRespuestaCorta(true); return false }
    setRespuestaCorta(false)
    setError('')
    return true
  }

  // ── Guardar respuesta actual ───────────────────────────────────────────
  const guardarRespuesta = () => {
    recognitionRef.current?.stop()
    const nuevas = [...respuestas]
    nuevas[preguntaIdx] = inputRespuesta.trim()
    setRespuestas(nuevas)
    return nuevas
  }

  // ── Siguiente pregunta ────────────────────────────────────────────────
  const siguientePregunta = async () => {
    if (!validarRespuesta()) return
    const nuevas = guardarRespuesta()
    setFeedbackInmediato(null)

    // Feedback por pregunta
    if (tipoFeedback === 'pregunta' && nuevas[preguntaIdx]) {
      setLoadingFeedbackInm(true)
      try {
        const res = await api.post('/api/interview/evaluar', {
          empresa, cargo, entrevistador,
          preguntas: [preguntas[preguntaIdx]],
          respuestas: [nuevas[preguntaIdx]],
          feedbackPorPregunta: true,
        })
        setFeedbackInmediato(res.detalle?.[0] || null)
      } catch { /* silencioso */ }
      finally { setLoadingFeedbackInm(false) }
    }

    if (feedbackInmediato || tipoFeedback === 'final') {
      const next = preguntaIdx + 1
      if (next >= preguntas.length) {
        await finalizarEntrevista(nuevas)
      } else {
        setPreguntaIdx(next)
        setInputRespuesta(nuevas[next] || '')
        setTimeout(() => leerEnVoz(preguntas[next].pregunta), 300)
      }
    }
  }

  const avanzarTraseFeedback = () => {
    setFeedbackInmediato(null)
    const next = preguntaIdx + 1
    if (next >= preguntas.length) {
      finalizarEntrevista(respuestas)
    } else {
      setPreguntaIdx(next)
      setInputRespuesta(respuestas[next] || '')
      setTimeout(() => leerEnVoz(preguntas[next].pregunta), 300)
    }
  }

  // ── Finalizar y evaluar ───────────────────────────────────────────────
  const finalizarEntrevista = async (resp = respuestas) => {
    detenerVoz()
    setLoadingEval(true)
    try {
      const resultado = await api.post('/api/interview/evaluar', {
        empresa, cargo, entrevistador, preguntas,
        respuestas: resp,
        feedbackPorPregunta: tipoFeedback === 'pregunta',
      })
      setEvaluacion(resultado)
      setPaso('feedback')
      // El reporte se guarda automáticamente en el backend (cv_results, TTL 14 días)
      setGuardadoEnPipeline(true)
    } catch {
      setError('Error al evaluar la entrevista.')
    } finally {
      setLoadingEval(false)
    }
  }

  const reiniciar = () => {
    detenerVoz()
    setPreguntas([]); setRespuestas([]); setPreguntaIdx(0)
    setInputRespuesta(''); setEvaluacion(null); setFeedbackInmediato(null)
    setGuardadoEnPipeline(false)
    setPaso('setup')
  }

  const preguntaActual = preguntas[preguntaIdx]
  const progreso = preguntas.length ? ((preguntaIdx) / preguntas.length) * 100 : 0

  // ── API expuesto por context (solo lo que consumen los componentes) ──────────
  return {
    // base
    user, navigate, textareaRef, esBrave, MIN_CHARS, preguntaActual, progreso,
    // estado
    paso, vacantesGuardadas, vacanteSel, empresa, cargo, entrevistador, descripcion,
    numPreguntas, tipoFeedback, preguntas, preguntaIdx, inputRespuesta,
    escuchando, hablando, muted, feedbackInmediato, loadingFeedbackInm, loadingPreguntas,
    loadingEval, error, evaluacion, guardadoEnPipeline, respuestaCorta, confirmSalir,
    activeBrowserTab,
    // setters consumidos por componentes
    setConfirmSalir, setVacanteSel, setEmpresa, setCargo, setDescripcion, setEntrevistador,
    setNumPreguntas, setTipoFeedback, setInputRespuesta, setRespuestaCorta, setPreguntaIdx,
    setError, setActiveBrowserTab,
    // handlers
    seleccionarVacante, toggleMute, leerEnVoz, toggleEscucha, iniciarEntrevista,
    validarRespuesta, guardarRespuesta, siguientePregunta, avanzarTraseFeedback,
    finalizarEntrevista, reiniciar,
  }
}
