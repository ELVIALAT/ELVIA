// features/landing/components/StickyCTA.jsx
// CTA flotante sticky (mobile/desktop) — oculto en modo comercial.
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { motion, AnimatePresence } from 'framer-motion'

export default function StickyCTA({ user, showStickyCTA, modoComercial, navigate }) {
  return (
    <AnimatePresence>
      {!user && showStickyCTA && !modoComercial && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 sm:left-auto sm:right-6 sm:bottom-6 sm:w-auto pointer-events-none"
        >
          <div className="pointer-events-auto bg-gray-900/95 backdrop-blur-xl border border-white/10 p-4 sm:p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between sm:justify-start gap-4 sm:gap-6 min-w-full sm:min-w-[400px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-teal-400 border border-white/10 shrink-0">
                EL
              </div>
              <div>
                <p className="text-white font-bold text-sm sm:text-base leading-tight">Optimiza tu carrera con ELVIA</p>
                <p className="text-gray-400 text-xs sm:text-sm">Únete a los +500 profesionales</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/auth?register=true')}
              className="bg-[#E8541A] hover:bg-[#E8541A]/90 text-white font-bold text-sm sm:text-base px-5 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-[0_0_20px_rgba(232,84,26,0.3)] transition-all active:scale-95 shrink-0"
            >
              Empezar gratis
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
