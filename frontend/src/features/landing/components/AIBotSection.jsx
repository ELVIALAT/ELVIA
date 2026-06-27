// features/landing/components/AIBotSection.jsx
// Sección "Conoce a ELVIA" con mockup 3D flotante del chat.
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { motion } from 'framer-motion'
import { CheckCircle, Kanban } from '@phosphor-icons/react'

export default function AIBotSection() {
  return (
    <section className="relative z-10 py-32 px-6 overflow-hidden bg-gray-900 border-t border-gray-800">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-[#E8541A]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-8 relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-gray-900/50">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Desarrollada por expertos en atracción de talento</span>
          </div>

          <h2 className="font-headline font-black text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-[1.1]">
            Conoce a <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">ELVIA</span>,<br />
            tu mentora 24/7.
          </h2>

          <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl">
            Un asistente diseñado para acompañarte en tu proceso, a tu ritmo, con respuestas claras y sencillas de entender, para guiarte hacia los mejores resultados posibles.
          </p>

          <ul className="space-y-4 text-gray-300 font-medium">
            {[
              'Preguntas sobre el uso del sistema',
              'Principales competencias',
              'Motivación y mucho más',
            ].map(item => (
              <li key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <CheckCircle size={14} weight="fill" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* 3D Floating Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative perspective-1000 lg:h-[500px] flex items-center justify-center mt-10 lg:mt-0"
        >
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotateY: [-5, 5, -5],
              rotateX: [2, -2, 2]
            }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            className="relative z-20 w-full max-w-sm"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-teal-400/20 to-emerald-600/20 blur-xl rounded-[2.5rem]" />

            {/* Chat Interface Glassmorphism */}
            <div className="relative bg-[#0A1A14]/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-4 border-b border-white/10 pb-5 mb-5">
                  <div className="w-12 h-12 rounded-full bg-[#0A3D2A] shadow-lg overflow-hidden flex items-center justify-center border border-teal-400/40">
                    <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="w-full h-full object-contain p-1.5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg leading-none">ELVIA</h4>
                    <span className="text-teal-400 text-xs font-semibold flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> En línea
                    </span>
                  </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white/10 border border-white/5 p-4 rounded-2xl rounded-tl-sm text-sm text-gray-200">
                  He analizado tu perfil. Tienes un excelente background, pero faltan métricas de impacto en tu ex-rol. ¿Te ayudo a redactarlas?
                </div>

                <div className="bg-teal-500/20 border border-teal-500/30 p-4 rounded-2xl rounded-tr-sm text-sm text-white ml-8">
                  Sí, por favor. Logramos reducir el tiempo de carga un 40%.
                </div>

                <div className="bg-white/10 border border-white/5 p-3 px-4 rounded-2xl rounded-tl-sm flex items-center min-h-[40px]">
                  <span className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative floating badges */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
              className="absolute -right-6 lg:-right-12 top-20 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl"
              style={{ transform: "translateZ(30px)" }}
            >
              <Kanban size={18} weight="fill" className="text-emerald-400" />
              <span className="text-emerald-300 text-xs font-bold tracking-wide">NLP Engine</span>
            </motion.div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
              className="absolute -left-6 lg:-left-10 bottom-16 bg-[#E8541A]/20 backdrop-blur-md border border-[#E8541A]/30 px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl"
              style={{ transform: "translateZ(50px)" }}
            >
              <CheckCircle size={18} weight="fill" className="text-[#E8541A]" />
              <span className="text-[#E8541A] text-xs font-bold tracking-wide">Revisión en 2s</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
