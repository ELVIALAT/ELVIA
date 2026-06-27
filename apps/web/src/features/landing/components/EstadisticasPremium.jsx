// features/landing/components/EstadisticasPremium.jsx
// Banner premium de estadísticas de impacto (fondo oscuro + glows).
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { motion } from 'framer-motion'
import { Target, TrendUp, RocketLaunch } from '@phosphor-icons/react'

export default function EstadisticasPremium() {
  return (
    <section className="relative z-10 py-24 px-6 bg-[#0a0f16] border-y border-white/[0.05] overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center gap-3 mb-6 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
             <span className="w-1.5 h-1.5 rounded-full bg-teal-400 font-bold" />
             <h2 className="text-white/70 text-xs font-bold uppercase tracking-[0.2em]">Impacto medible</h2>
          </div>
          <h3 className="font-headline font-black text-3xl md:text-5xl text-white tracking-tight">
            Los datos hablan por sí solos
          </h3>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 relative">
          <div className="hidden md:block absolute top-[40%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {[
            {
              stat: '3x',
              title: 'Velocidad de contratación',
              desc: 'Al tener una estrategia clara antes de aplicar, triplicas tu probabilidad de encontrar el trabajo ideal.',
              Icon: Target,
              glowClass: 'bg-teal-500/20',
              boxClass: 'from-teal-500/10 to-teal-500/5 border-teal-500/20',
              iconClass: 'text-teal-400'
            },
            {
              stat: '65%',
              title: 'Match con vacantes',
              desc: 'Cuando alineas tu propuesta de valor, tu compatibilidad con el mercado laboral aumenta dramáticamente.',
              Icon: TrendUp,
              glowClass: 'bg-blue-500/20',
              boxClass: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
              iconClass: 'text-blue-400'
            },
            {
              stat: '40%',
              title: 'Entrevistas conseguidas',
              desc: 'Al optimizar tu perfil para sistemas ATS, incrementas sustancialmente tu paso al primer filtro humano.',
              Icon: RocketLaunch,
              glowClass: 'bg-emerald-500/20',
              boxClass: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
              iconClass: 'text-emerald-400'
            }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className="relative flex flex-col items-center text-center p-4 md:p-12 group"
            >
              {/* Separador vertical entre columnas */}
              {idx !== 2 && (
                <div className="hidden md:block absolute top-[10%] right-0 w-[1px] h-[80%] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
              )}

              {/* Icon Wrapper con Glow Soft */}
              <div className="relative mb-8 flex items-center justify-center w-16 h-16 transition-transform duration-500 group-hover:-translate-y-2">
                 <div className={`absolute inset-0 ${item.glowClass} blur-[20px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                 <div className={`relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${item.boxClass} border backdrop-blur-md shadow-inner`}>
                   <item.Icon size={28} weight="duotone" className={item.iconClass} />
                 </div>
              </div>

              {/* Número Grande Premium */}
              <div className="text-6xl md:text-7xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 drop-shadow-sm group-hover:scale-105 transition-transform duration-500">
                {item.stat}
              </div>

              <h4 className="text-white font-bold text-lg mb-3 tracking-wide">{item.title}</h4>
              <p className="text-white/50 text-sm leading-relaxed max-w-[260px] mx-auto group-hover:text-white/70 transition-colors">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
