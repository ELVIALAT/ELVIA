// features/landing/components/ShowcaseHerramientas.jsx
// Showcase "Herramientas en acción" con widget de nivel de optimización.
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { motion } from 'framer-motion'
import { Check } from '@phosphor-icons/react'

export default function ShowcaseHerramientas({ modoComercial, navigate }) {
  return (
    <section className="relative z-10 py-20 px-6 bg-white border-b border-gray-200">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16 space-y-3"
        >
          <span className="text-[#E8541A] font-bold text-sm tracking-widest uppercase">En tiempo real</span>
          <h2 className="font-headline font-black text-4xl md:text-5xl tracking-tight text-gray-900">
            Herramientas en acción
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Nuestro sistema analiza cada sección de tu CV en tiempo real, recomendándote mejoras basadas en mejores prácticas del mercado laboral.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Contextual Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="font-headline font-bold text-2xl text-gray-900">Optimización en cada paso</h3>
              <p className="text-gray-600 leading-relaxed">
                Partiendo de tu AUTOCONOCIMIENTO y mientras editas tu CV, ELVIA analiza cada sección: desde tu titular y resumen profesional, hasta tus experiencias y logros.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                  <Check size={20} weight="bold" className="text-teal-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Análisis Inteligente</h4>
                  <p className="text-sm text-gray-600">Usa tu propia información que registras para crear tu perfil y no solo eso, tiene en cuenta tu OFERTA DE VALOR para el mercado.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                  <Check size={20} weight="bold" className="text-teal-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Recomendaciones Accionables</h4>
                  <p className="text-sm text-gray-600">Sugerencias concretas para mejorar cada sección de tu perfil</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0 mt-1">
                  <Check size={20} weight="bold" className="text-teal-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Seguimiento en Tiempo Real</h4>
                  <p className="text-sm text-gray-600">Puedes guardar tus reportes y volverlos a ver, un sistema dinámico que te permite aprender de ti constantemente.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Optimization Widget (Simplified) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative"
          >
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              {/* Header */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 mb-3">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Análisis en vivo</span>
                </div>
                <h3 className="font-headline font-bold text-xl text-gray-900">Nivel de Optimización</h3>
                <p className="text-sm text-gray-500 mt-1">Tu score de compatibilidad</p>
              </div>

              {/* Main Score */}
              <div className="mb-8 text-center">
                <div className="inline-flex flex-col items-center gap-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth="8"
                        strokeDasharray="141"
                        strokeDashoffset="35"
                        strokeLinecap="round"
                        className="transition-all duration-500"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                        78%
                      </span>
                      <span className="text-xs text-gray-500 font-semibold mt-1">Muy bien</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-semibold">Titular</span>
                    <span className="text-teal-600 font-bold">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-semibold">Experiencia</span>
                    <span className="text-teal-600 font-bold">78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-semibold">Habilidades</span>
                    <span className="text-teal-600 font-bold">65%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => modoComercial
                  ? document.getElementById('contacto-comercial')?.scrollIntoView({ behavior: 'smooth' })
                  : navigate('/auth?register=true')}
                className="w-full mt-8 bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
              >
                {modoComercial ? 'Quiero más información' : 'Comenzar análisis gratuito'}
              </button>
            </div>

            {/* Floating accent */}
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-4 -right-4 w-24 h-24 bg-teal-100/40 rounded-full blur-3xl pointer-events-none"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
