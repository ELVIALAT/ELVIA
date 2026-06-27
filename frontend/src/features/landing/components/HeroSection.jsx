// features/landing/components/HeroSection.jsx
// Hero principal de la landing + widget "Gerente de Proyecto PMI®" + trust badges.
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { motion } from 'framer-motion'
import {
  ArrowRight, ArrowDown, CheckCircle, ChartBar,
  ShieldCheck, Lightning, Target, Star,
  MagnifyingGlass, Kanban,
} from '@phosphor-icons/react'

// ─── Animaciones ──────────────────────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
}

export default function HeroSection({ modoComercial, navigate }) {
  return (
    <section className="relative z-10 pt-12 pb-20 md:pt-20 md:pb-32 px-6 lg:min-h-[85vh] flex items-center">
      <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-stretch">

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-2xl h-full flex flex-col"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-[#E8541A] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">ELVIA Está en vivo</span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="font-headline font-black text-5xl sm:text-7xl leading-[1.05] tracking-tight mb-8">
            Sé tu propio gerente<br />
            <span className="text-[#002650] inline-block">
              de tu búsqueda laboral
            </span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-4 max-w-lg">
            Encuentra tu propósito y ten las herramientas necesarias para encontrar tu siguiente proyecto laboral y profesional.
          </motion.p>
          <motion.p variants={fadeInUp} className="text-base text-gray-500 leading-relaxed mb-4 max-w-lg">
            ELVIA es el sistema comprobado que te acompaña de inicio a fin, y no se queda solo en documentos.
          </motion.p>
          <motion.p variants={fadeInUp} className="text-base text-gray-500 leading-relaxed mb-10 max-w-lg">
            El AUTOCONOCIMIENTO es la base de ELVIA, entre más información relevante de ti, mejores resultados. A veces no es cuestión de una CV bonita, es de realmente entender que quieres en tu siguiente paso profesional.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {modoComercial ? (
              <>
                <button
                  onClick={() => document.getElementById('contacto-comercial')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-[#E8541A] text-white font-black py-4 px-8 rounded-2xl text-lg transition-all shadow-[0_8px_30px_rgba(232,84,26,0.3)] hover:shadow-[0_8px_30px_rgba(232,84,26,0.5)] flex items-center gap-2 group w-full sm:w-auto justify-center h-14"
                >
                  Quiero más información
                  <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" weight="bold" />
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  className="bg-white border-2 border-gray-200 text-gray-800 font-bold py-4 px-8 rounded-2xl text-lg transition-all hover:border-gray-400 hover:bg-gray-50 flex items-center gap-2 w-full sm:w-auto justify-center h-14"
                >
                  Ya tengo cuenta · Iniciar sesión
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-[#E8541A] text-white font-black py-4 px-8 rounded-2xl text-lg transition-all shadow-[0_8px_30px_rgba(232,84,26,0.3)] hover:shadow-[0_8px_30px_rgba(232,84,26,0.5)] flex items-center gap-2 group w-full sm:w-auto justify-center h-14"
                >
                  Únete y sé pionero ELVIA
                  <ArrowDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" weight="bold" />
                </button>

                <div className="flex items-center gap-3 text-sm text-gray-500 mt-2 sm:mt-0">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-teal-100 flex items-center justify-center relative z-30 shadow-sm text-teal-700 font-bold text-xs tracking-tighter">AM</div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center relative z-20 shadow-sm text-blue-700 font-bold text-xs tracking-tighter">JR</div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center relative z-10 shadow-sm text-amber-700 font-bold text-xs tracking-tighter">CV</div>
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} size={14} weight="fill" className="text-amber-500" />)}
                    </div>
                    <p className="text-xs mt-0.5"><strong className="text-gray-900">+500</strong> en lista</p>
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* Trust Badges moved inside the right column below mockup */}
        </motion.div>

        {/* Gerente de Proyecto PMI® Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          className="relative h-full flex flex-col"
        >
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] flex-1 flex flex-col">
            {/* Header con badge PMI® */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-gray-200 mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Según PMI®</span>
              </div>
              <h3 className="text-2xl font-black text-[#002650] mb-2">Gerente de Proyecto</h3>
              <p className="text-sm text-gray-500">De tu búsqueda laboral</p>
            </div>

            {/* Definición */}
            <div className="mb-8 pb-8 border-b border-gray-100">
              <p className="text-sm text-gray-600 leading-relaxed">
                Un Gerente de Proyecto es quien <strong>planifica, ejecuta y controla</strong> un proyecto para alcanzar sus objetivos. Aplicado a tu carrera, <strong>TÚ eres ese gerente</strong>.
              </p>
            </div>

            {/* Grid 3x2 de beneficios */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { icon: MagnifyingGlass, label: 'Autodescubrimiento', desc: 'Conoce quién eres' },
                { icon: ShieldCheck, label: 'Fortalezas', desc: 'Sabe en qué eres bueno' },
                { icon: Target, label: 'Oferta de valor', desc: 'Descubre tu propuesta' },
                { icon: Lightning, label: 'Herramientas', desc: 'Recursos optimizados' },
                { icon: ChartBar, label: 'Seguimiento', desc: 'Control y visibilidad' },
                { icon: CheckCircle, label: 'Tranquilidad', desc: 'Te guía en el proceso' }
              ].map((benefit, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-[#002650]/20 hover:bg-slate-50/50 transition-all">
                  <benefit.icon size={24} weight="duotone" className="text-[#002650] mb-2" />
                  <p className="text-xs font-bold text-gray-900 mb-1">{benefit.label}</p>
                  <p className="text-[10px] text-gray-500">{benefit.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => modoComercial
                ? document.getElementById('contacto-comercial')?.scrollIntoView({ behavior: 'smooth' })
                : navigate('/auth?register=true')}
              className="w-full flex items-center justify-center gap-2 bg-[#E8541A] hover:bg-[#d44813] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md shadow-orange-500/10 mt-auto group"
            >
              {modoComercial ? 'Quiero más información' : 'Empezar gratis ahora'} <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Trust Badges — debajo del widget */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white hover:border-gray-300 transition-all">
               <MagnifyingGlass size={28} weight="duotone" className="text-teal-500 mb-1" />
               <span className="text-sm font-black tracking-tight text-gray-900">Autodescubrimiento</span>
               <span className="text-xs text-gray-500 leading-tight">Conoce quién eres y qué ofreces.</span>
            </div>
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white hover:border-gray-300 transition-all">
               <Kanban size={28} weight="duotone" className="text-amber-500 mb-1" />
               <span className="text-sm font-black tracking-tight text-gray-900">Proceso Estructurado</span>
               <span className="text-xs text-gray-500 leading-tight">De inicio a fin, como un proyecto real.</span>
            </div>
            <div className="flex flex-col gap-1.5 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-sm hover:bg-white hover:border-gray-300 transition-all">
               <Target size={28} weight="duotone" className="text-blue-500 mb-1" />
               <span className="text-sm font-black tracking-tight text-gray-900">Control Total</span>
               <span className="text-xs text-gray-500 leading-tight">Tú decides el ritmo, nosotros te guiamos.</span>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  )
}
