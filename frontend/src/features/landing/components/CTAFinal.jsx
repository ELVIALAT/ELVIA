// features/landing/components/CTAFinal.jsx
// CTA final post-lanzamiento (card oscura con glows + social proof).
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Lightning, Star } from '@phosphor-icons/react'

export default function CTAFinal({ modoComercial, navigate }) {
  return (
    <section className="relative z-10 py-24 px-6 border-t border-gray-200 bg-white">
      <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         whileInView={{ opacity: 1, scale: 1 }}
         viewport={{ once: true }}
         className="container mx-auto max-w-5xl bg-[#090E17] rounded-[3rem] p-10 md:p-20 shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] relative overflow-hidden flex flex-col items-center text-center border border-white/10"
      >
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-teal-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-48 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none" />

        {/* Icon/Logo */}
        <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-teal-400/20 blur-2xl rounded-full" />
          {/* Logo removido temporalmente */}
          <div className="absolute bottom-0 -right-2 bg-gradient-to-br from-[#E8541A] to-orange-600 text-white p-2.5 rounded-2xl shadow-xl shadow-orange-500/20 border border-white/10">
            <Lightning size={24} weight="fill" />
          </div>
        </div>

        <h2 className="font-headline font-black text-4xl md:text-6xl tracking-tight text-white mb-6">
          Tu futuro gerente de<br className="hidden md:block" /> proyecto te espera
        </h2>
        <p className="text-gray-400 text-lg md:text-xl max-w-3xl mb-8 font-medium">
          Únete a cientos de profesionales que ya están haciendo el ejercicio de autoconocerse, optimizando su carrera y obteniendo las herramientas necesarias para su transición de carrera.
        </p>

        <div className="flex flex-col items-center gap-4 mb-12">
           <div className="flex -space-x-2">
             <div className="w-10 h-10 rounded-full border-2 border-[#090E17] bg-[#CCFBF1] text-[#115E59] flex items-center justify-center text-[11px] font-black shadow-lg">AM</div>
             <div className="w-10 h-10 rounded-full border-2 border-[#090E17] bg-[#DBEAFE] text-[#1E40AF] flex items-center justify-center text-[11px] font-black shadow-lg">JR</div>
             <div className="w-10 h-10 rounded-full border-2 border-[#090E17] bg-[#FEF3C7] text-[#92400E] flex items-center justify-center text-[11px] font-black shadow-lg">CV</div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-0.5">
                 {[1,2,3,4,5].map(i => <Star key={i} size={16} weight="fill" className="text-amber-400" />)}
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">+500 en lista</span>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto z-10">
          <button
            onClick={() => modoComercial
              ? document.getElementById('contacto-comercial')?.scrollIntoView({ behavior: 'smooth' })
              : navigate('/auth?register=true')}
            className="w-full sm:w-auto bg-[#E8541A] hover:bg-[#E8541A]/90 text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all shadow-[0_0_30px_rgba(232,84,26,0.3)] hover:shadow-[0_0_30px_rgba(232,84,26,0.5)] flex items-center justify-center gap-3 group"
          >
            {modoComercial ? 'Solicitar información ahora' : 'Crear mi cuenta gratis ahora'}
            <ArrowRight size={20} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </button>
          {modoComercial && (
            <button
              onClick={() => navigate('/auth')}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all border border-white/20 flex items-center justify-center gap-3"
            >
              Ya tengo cuenta · Iniciar sesión
            </button>
          )}
        </div>

        {!modoComercial && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm font-semibold tracking-wide text-gray-500 z-10">
            <span className="flex items-center gap-2 text-center sm:text-left"><CheckCircle size={18} weight="fill" className="text-teal-500" /> Sin tarjeta de crédito para la prueba de 7 días</span>
            <span className="flex items-center gap-2 text-center sm:text-left"><CheckCircle size={18} weight="fill" className="text-teal-500" /> Funcionalidades gratis</span>
          </div>
        )}
      </motion.div>
    </section>
  )
}
