// features/landing/components/StatsStrip.jsx
// Franja de estadísticas con contadores animados.
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import AnimatedCounter from './AnimatedCounter'

export default function StatsStrip() {
  return (
    <section className="relative z-10 border-y border-gray-200 bg-white py-10">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-200 text-center">
          {[
            { target: 75, suffix: '%', label: 'Tasa de rechazo inicial por filtros ATS sin optimizar' },
            { target: 3,  suffix: 'x', label: 'Mayor probabilidad de entrevista con un formato optimizado de clase mundial' },
            { target: 8,  suffix: 's', label: 'Tiempo promedio que un reclutador lee tu CV' },
          ].map(({ target, suffix, label }) => (
            <div key={label} className="px-6 py-4 md:py-0">
              <p className="font-headline font-black text-4xl text-teal-600 md:text-5xl mb-2">
                <AnimatedCounter target={target} suffix={suffix} />
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-[220px] mx-auto">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
