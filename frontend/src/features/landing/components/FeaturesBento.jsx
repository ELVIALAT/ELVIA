// features/landing/components/FeaturesBento.jsx
// Grid de features: lista en mobile, círculo orbital en desktop + card de Mentor.
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { motion } from 'framer-motion'
import {
  FileMagnifyingGlass, MagnifyingGlass, Kanban, ChartBar,
  BookmarkSimple, Books, LinkedinLogo, MicrophoneStage, UsersThree,
} from '@phosphor-icons/react'

export default function FeaturesBento() {
  return (
    <section id="features-section" className="relative z-10 py-24 px-6 bg-slate-50">
      <div className="container mx-auto max-w-6xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-14 space-y-3"
        >
          <span className="text-[#E8541A] font-bold text-sm tracking-widest uppercase">Tu sistema completo</span>
          <h2 className="font-headline font-black text-4xl md:text-5xl tracking-tight text-gray-900">
            Desde autoconocimiento a Oferta.<br className="hidden md:block" /> Todo en un solo lugar.
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Herramientas de alto valor, gestión de candidaturas y mentores reales — diseñados para que consigas el trabajo que mereces.
          </p>
        </motion.div>

        {/* Mobile: lista */}
        <div className="md:hidden space-y-3 mb-4">
          <div className="rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg shadow-blue-200/30">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 border border-blue-200 mb-4">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Centro del sistema</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
              <UsersThree size={24} weight="duotone" className="text-blue-600" />
            </div>
            <h3 className="font-bold text-xl text-blue-900 mb-1">Autoconocimiento</h3>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-3">Tu primer paso</p>
            <p className="text-sm text-blue-700 leading-relaxed">Un onboarding para que conozcas tu momento actual y hacia donde quieres ir. Prepárate para tu transición profesional.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { Icon: FileMagnifyingGlass, titulo: 'Optimizador de CV',    iconBg: 'bg-orange-100', iconColor: 'text-[#E8541A]' },
              { Icon: LinkedinLogo,        titulo: 'LinkedIn® Optimizado', iconBg: 'bg-blue-100',   iconColor: 'text-blue-600'  },
              { Icon: MagnifyingGlass,     titulo: 'CV vs Vacante',        iconBg: 'bg-amber-100',  iconColor: 'text-amber-600' },
              { Icon: BookmarkSimple,      titulo: 'Mis Vacantes',         iconBg: 'bg-teal-100',   iconColor: 'text-teal-600'  },
              { Icon: Kanban,              titulo: 'Pipeline',             iconBg: 'bg-teal-100',   iconColor: 'text-teal-600'  },
              { Icon: MicrophoneStage,     titulo: 'Entrevista',           iconBg: 'bg-purple-100', iconColor: 'text-purple-600'},
              { Icon: Books,              titulo: 'Biblioteca',           iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600'},
              { Icon: ChartBar,            titulo: 'Bienestar',            iconBg: 'bg-green-100',  iconColor: 'text-green-600' },
            ].map(item => (
              <div key={item.titulo} className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.iconBg} ${item.iconColor}`}>
                  <item.Icon size={20} weight="duotone" />
                </div>
                <h4 className="font-bold text-sm text-gray-900 leading-tight">{item.titulo}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: círculo orbital */}
        <div className="hidden md:block relative mx-auto mb-4" style={{ maxWidth: '700px', height: '700px' }}>
          {/* Anillo de órbita */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-gray-200 pointer-events-none"
            style={{ width: '580px', height: '580px' }}
          />

          {/* Centro: Autoconocimiento */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20" style={{ width: '160px' }}>
            <div className="rounded-2xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-white p-5 shadow-xl shadow-blue-200/40 text-center">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 border border-blue-200 mb-3">
                <span className="text-[9px] font-bold text-blue-700 uppercase tracking-widest">Centro</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <UsersThree size={24} weight="duotone" className="text-blue-600" />
              </div>
              <h3 className="font-bold text-sm text-blue-900 leading-tight">Autoconocimiento</h3>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600 mt-1">Tu primer paso</p>
            </div>
          </div>

          {/* Ítems orbitales — 8 en círculo, sentido horario desde arriba */}
          {[
            { Icon: FileMagnifyingGlass, titulo: 'Optimizador de CV',    iconBg: 'bg-orange-100', iconColor: 'text-[#E8541A]' },
            { Icon: LinkedinLogo,        titulo: 'LinkedIn® Optimizado', iconBg: 'bg-blue-100',   iconColor: 'text-blue-600'  },
            { Icon: MagnifyingGlass,     titulo: 'CV vs Vacante',        iconBg: 'bg-amber-100',  iconColor: 'text-amber-600' },
            { Icon: BookmarkSimple,      titulo: 'Mis Vacantes',         iconBg: 'bg-teal-100',   iconColor: 'text-teal-600'  },
            { Icon: Kanban,              titulo: 'Pipeline',             iconBg: 'bg-teal-100',   iconColor: 'text-teal-600'  },
            { Icon: MicrophoneStage,     titulo: 'Entrevista',           iconBg: 'bg-purple-100', iconColor: 'text-purple-600'},
            { Icon: Books,              titulo: 'Biblioteca',           iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600'},
            { Icon: ChartBar,            titulo: 'Bienestar',            iconBg: 'bg-green-100',  iconColor: 'text-green-600' },
          ].map((item, i) => {
            const angleDeg = -90 + i * 45
            const angleRad = angleDeg * Math.PI / 180
            const r = 41.5
            const x = 50 + r * Math.cos(angleRad)
            const y = 50 + r * Math.sin(angleRad)
            return (
              <div
                key={item.titulo}
                className="absolute z-10"
                style={{ top: `${y}%`, left: `${x}%`, transform: 'translate(-50%, -50%)', width: '116px' }}
              >
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 12px 24px -6px rgba(0,0,0,0.12)' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm text-center cursor-default"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${item.iconBg} ${item.iconColor}`}>
                    <item.Icon size={20} weight="duotone" />
                  </div>
                  <h4 className="font-bold text-xs text-gray-900 leading-tight">{item.titulo}</h4>
                </motion.div>
              </div>
            )
          })}
        </div>

        {/* ─── Fila 4: Mentor Experto ─── card premium full-width ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          whileHover={{ y: -4, boxShadow: '0 30px 60px -15px rgba(0,0,0,0.35)' }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-[#002650] border border-slate-700/50"
        >
          {/* Glow sutil en hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {/* Patrón de fondo decorativo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.02] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Icono */}
            <div
              className="rounded-2xl flex items-center justify-center shrink-0 border border-teal-400/30 group-hover:border-teal-300/60 transition-colors duration-300"
              style={{ width: 72, height: 72, background: 'linear-gradient(135deg, rgba(20,184,166,0.3) 0%, rgba(13,148,136,0.15) 100%)' }}
            >
              <UsersThree size={40} weight="fill" className="text-teal-200 group-hover:text-white transition-colors duration-300" />
            </div>

            {/* Texto */}
            <div className="flex-1">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-white mb-2 block">Hablemos</span>
              <h3 className="font-headline font-black text-2xl text-white mb-2">
                Mentor Experto — cuando la IA no es suficiente
              </h3>
              <p className="text-white/55 text-sm leading-relaxed max-w-xl group-hover:text-white/75 transition-colors duration-300">
                Orientación personalizada, feedback honesto y el impulso que solo un humano puede darte.
              </p>
            </div>

            {/* CTA */}
            <div
              className="flex items-center gap-2.5 text-white/50 font-bold text-sm shrink-0 bg-white/5 px-6 py-3.5 rounded-xl border border-white/5 whitespace-nowrap cursor-default">
              Próximamente
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
