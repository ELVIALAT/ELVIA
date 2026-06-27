import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { usePlan } from '../context/usePlan'
import { motion, useScroll, useSpring } from 'framer-motion'

import NavLanding from '../features/landing/components/NavLanding'
import BannerOnboarding from '../features/landing/components/BannerOnboarding'
import HeroSection from '../features/landing/components/HeroSection'
import StatsStrip from '../features/landing/components/StatsStrip'
import AIBotSection from '../features/landing/components/AIBotSection'
import DemoInteractiva from '../features/landing/components/DemoInteractiva'
import FeaturesBento from '../features/landing/components/FeaturesBento'
import EstadisticasPremium from '../features/landing/components/EstadisticasPremium'
import ShowcaseHerramientas from '../features/landing/components/ShowcaseHerramientas'
import ContactoComercial from '../features/landing/components/ContactoComercial'
import CTAFinal from '../features/landing/components/CTAFinal'
import FooterLanding from '../features/landing/components/FooterLanding'
import StickyCTA from '../features/landing/components/StickyCTA'

// ─── Componente principal ──────────────────────────────────────────────────
// modoComercial=true → oculta CTAs de registro abierto y muestra formulario "Solicitar información".
// Se usa cuando la landing está montada en la raíz `/` como página comercial B2B.
export default function Landing({ modoComercial = false }) {
  const navigate  = useNavigate()
  const { user } = useAuth()
  const { perfil } = useProfile()
  const { creditosRestantes, LIMITE_PLAN } = usePlan()
  const { scrollYProgress } = useScroll()
  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  // Detectar onboarding incompleto
  const onboardingIncompleto = user && !perfil?.nombre1

  // ─── Simulador Interactivo (auto-type) ──────────────────────────────────
  const DEMO_JOB_TEXT = 'La Compañía busca un perfil de Operaciones con experiencia en la industria de alimentos. El candidato ideal tiene 3+ años liderando procesos de calidad, coordinación de proveedores y mejora continua (Lean/Six Sigma). Excelente comunicación, visión analítica y enfoque en resultados. Deseable experiencia en ERP (SAP o similar).'
  const [demoText, setDemoText] = useState('')
  const [demoTypingDone, setDemoTypingDone] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoLoadingText, setDemoLoadingText] = useState('Ejecutar simulador')
  const [showDemoOverlay, setShowDemoOverlay] = useState(false)
  const demoSectionRef = useRef(null)
  const demoTypingStarted = useRef(false)

  // ─── Formulario contacto comercial (solo modoComercial) ──────────────────
  const [contactoForm, setContactoForm] = useState({ nombre: '', empresa: '', email: '', telefono: '', mensaje: '' })
  const [contactoEnviando, setContactoEnviando] = useState(false)
  const [contactoEnviado, setContactoEnviado] = useState(false)
  const [contactoError, setContactoError] = useState('')

  const enviarContactoComercial = async (e) => {
    e.preventDefault()
    setContactoError('')
    if (!contactoForm.nombre.trim() || !contactoForm.email.trim() || !contactoForm.empresa.trim()) {
      setContactoError('Por favor completa nombre, empresa y email.')
      return
    }
    setContactoEnviando(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://cv-optimizer-pro-production.up.railway.app'
      const res = await fetch(`${apiUrl}/api/email/contacto-comercial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactoForm),
      })
      if (!res.ok) throw new Error('Error enviando')
      setContactoEnviado(true)
      setContactoForm({ nombre: '', empresa: '', email: '', telefono: '', mensaje: '' })
    } catch (err) {
      setContactoError('No pudimos enviar tu mensaje. Intenta de nuevo o escribe a comercial@elvia.lat.')
    } finally {
      setContactoEnviando(false)
    }
  }

  // ─── Sticky CTA (Recomendación Marketing) ──────────────────────────────
  const [showStickyCTA, setShowStickyCTA] = useState(false)
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) setShowStickyCTA(true)
      else setShowStickyCTA(false)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToWaitlist = () => {
    document.getElementById('waitlist-form-bottom')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }

  useEffect(() => {
    const section = demoSectionRef.current
    if (!section) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !demoTypingStarted.current) {
        demoTypingStarted.current = true
        let i = 0
        const timer = setInterval(() => {
          i++
          setDemoText(DEMO_JOB_TEXT.slice(0, i))
          if (i >= DEMO_JOB_TEXT.length) {
            clearInterval(timer)
            setDemoTypingDone(true)
            // Analytics: Simulación terminada
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
            fetch(`${API_URL}/api/events/track`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ event_name: 'demo_complete' })
            }).catch(() => {})
          }
        }, 28)
      }
    }, { threshold: 0.1 })
    obs.observe(section)
    return () => obs.disconnect()
  }, [])

  const handleDemoSubmit = () => {
     setDemoLoading(true)
     setDemoLoadingText('Analizando palabras clave ATS...')
     setTimeout(() => setDemoLoadingText('Cruzando requerimientos con CV...'), 1200)
     setTimeout(() => setDemoLoadingText('Calculando penalizaciones de sintaxis...'), 2400)
     setTimeout(() => {
         setDemoLoadingText('Análisis Completo')
         setShowDemoOverlay(true)
     }, 3500)
  }



  useEffect(() => {
    // Analytics: Registrar visita a la Landing
    if (window.location.hostname !== 'localhost') {
       fetch((import.meta.env.VITE_API_URL || 'https://optima-backend-production.up.railway.app') + '/api/waitlist/track', { method: 'POST' }).catch(() => {})
    }

    // Dynamic Config: SEO & Headline
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    // LOW-2 fix: GET /api/events/track eliminado (generaba 404 en cada visita)

    // Using Supabase client for simple public read
    import('@supabase/supabase-js').then(({ createClient }) => {
      const db = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
      db.from('landing_config').select('*').then(({ data }) => {
        if (data) {
          const title = data.find(c => c.config_key === 'seo_title')?.config_value
          const desc  = data.find(c => c.config_key === 'seo_meta_description')?.config_value
          if (title) document.title = title
          if (desc) {
            let meta = document.querySelector('meta[name="description"]')
            if (meta) meta.setAttribute('content', desc)
          }
        }
      })
    })

  }, [])
  return (
    <div className="min-h-screen bg-slate-50 font-body text-gray-900 selection:bg-[#E8541A]/20 relative overflow-hidden">

      {/* Background Gradients (suaves, para fondo claro) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-teal-100 to-transparent blur-[150px] opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-blue-100 to-transparent blur-[150px] opacity-60" />
      </div>

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-[#E8541A] to-blue-500 z-[60] origin-left"
        style={{ scaleX: springScroll }}
      />

      {/* ─── Nav landing ────────────────────────────────────────────────────────── */}
      <NavLanding
        user={user}
        perfil={perfil}
        creditosRestantes={creditosRestantes}
        LIMITE_PLAN={LIMITE_PLAN}
        modoComercial={modoComercial}
        navigate={navigate}
      />

      {/* ─── Banner onboarding incompleto ────────────────────────────────────────── */}
      {onboardingIncompleto && (
        <BannerOnboarding navigate={navigate} />
      )}

      {/* ─── Hero Section ───────────────────────────────────────────────────────── */}
      <HeroSection modoComercial={modoComercial} navigate={navigate} />

      {/* ─── Stats Strip ────────────────────────────────────────────────────────── */}
      <StatsStrip />

      {/* ─── Seccion AI Bot 3D ───────────────────────────────────────────────────── */}
      <AIBotSection />

      {/* ─── Seccion Demo Interactive (Curiosity Gap Widget) ────────────────────── */}
      <DemoInteractiva
        demoSectionRef={demoSectionRef}
        demoText={demoText}
        demoTypingDone={demoTypingDone}
        demoLoading={demoLoading}
        demoLoadingText={demoLoadingText}
        showDemoOverlay={showDemoOverlay}
        handleDemoSubmit={handleDemoSubmit}
        modoComercial={modoComercial}
        navigate={navigate}
      />

      {/* ─── Features Bento Grid ────────────────────────────────────────────────── */}
      <FeaturesBento />

      {/* ─── Banner de Estadísticas Premium ─────────────────────────────────────── */}
      <EstadisticasPremium />

      {/* ─── Showcase: Herramientas en Acción ────────────────────────────────────── */}
      <ShowcaseHerramientas modoComercial={modoComercial} navigate={navigate} />

      {/* ─── Formulario contacto comercial (solo modoComercial) ───────────────────────── */}
      {modoComercial && (
        <ContactoComercial
          contactoForm={contactoForm}
          setContactoForm={setContactoForm}
          contactoEnviando={contactoEnviando}
          contactoEnviado={contactoEnviado}
          contactoError={contactoError}
          enviarContactoComercial={enviarContactoComercial}
        />
      )}

      {/* ─── CTA Final Post-Lanzamiento ──────────────────────────────────────────────────────────── */}
      <CTAFinal modoComercial={modoComercial} navigate={navigate} />

      {/* ─── Footer Minimalista ───────────────────────────────────────────────────── */}
      <FooterLanding />

      {/* Sticky CTA (Mobile/Desktop) — oculto en modo comercial */}
      <StickyCTA
        user={user}
        showStickyCTA={showStickyCTA}
        modoComercial={modoComercial}
        navigate={navigate}
      />
    </div>
  )
}
