// features/cv/components/PanelAnalisis.jsx
// Panel lateral de análisis de calidad del CV.
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import { X, CheckCircle } from '@phosphor-icons/react'

export default function PanelAnalisis({ analisis, onClose }) {
  const colors = {
    green: { bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'border-emerald-400', score: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
    amber: { bg: 'bg-amber-50',   border: 'border-amber-200',   ring: 'border-amber-400',   score: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700'   },
    red:   { bg: 'bg-red-50',     border: 'border-red-200',     ring: 'border-red-300',     score: 'text-red-500',     badge: 'bg-red-100 text-red-700'       },
  }
  const c = colors[analisis.nivel]

  return (
    <div className={`rounded-2xl border p-5 space-y-4 ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-800 text-base">Análisis del CV</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18} /></button>
      </div>
      <div className="-mt-2 space-y-1">
        <p className="text-xs font-semibold text-slate-600">Análisis bajo estándares Harvard / LATAM 2026 y expertos mentores de carrera.</p>
        <p className="text-[11px] text-slate-400 leading-relaxed">Esta es información privada y solo tuya. Nuestras recomendaciones son parte del proceso, pero tú debes aprobar los cambios.</p>
      </div>

      {/* Score */}
      <div className="flex items-center gap-4">
        <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center shrink-0 ${c.ring}`}>
          <div className="text-center">
            <div className={`text-2xl font-black ${c.score}`}>{analisis.porcentaje}%</div>
            <div className="text-[9px] font-bold text-slate-500">Optim.</div>
          </div>
        </div>
        <div>
          <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${c.badge}`}>{analisis.estado}</span>
          <div className="mt-2">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className={`h-2 rounded-full ${analisis.nivel === 'green' ? 'bg-emerald-500' : analisis.nivel === 'amber' ? 'bg-amber-500' : 'bg-red-400'}`}
                style={{ width: `${analisis.porcentaje}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      {analisis.recs.length > 0 && (
        <div>
          <p className="text-sm font-bold text-slate-600 mb-2">Áreas a mejorar:</p>
          <ul className="space-y-2">
            {analisis.recs.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700 bg-white/70 p-2.5 rounded-lg border border-white/80 leading-snug">
                <span className="text-amber-500 font-bold shrink-0 mt-0.5">•</span> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {analisis.recs.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm text-emerald-700 bg-white/70 p-3 rounded-lg flex items-start gap-2">
            <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Revisa cada sección para incluir actualizaciones, indicadores de gestión o información relevante. Después de esto, te generaremos una CV optimizada.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
