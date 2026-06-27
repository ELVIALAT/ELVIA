// components/cv-vs-job/HistorialAnalisis.jsx
// Extraído verbatim desde pages/CVvsJob.jsx (Fase 3, archivos >800).
// Lista colapsable de análisis recientes. La lógica de carga del CV adaptado al
// seleccionar un item vive en el page y se pasa por props (onSelect).
import { CaretDown, ArrowRight } from '@phosphor-icons/react'

export default function HistorialAnalisis({ historial, mostrar, onToggle, onSelect }) {
  if (historial.length === 0) return null
  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-sm font-bold text-gray-700">Análisis recientes</h3>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          {mostrar ? 'Ocultar' : `Ver últimos ${Math.min(historial.length, 10)}`}
          <CaretDown size={12} className={`transition-transform ${mostrar ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {mostrar && (
        <div className="mt-4 space-y-2">
          {historial.slice(0, 10).map((item) => {
            const meta = item.metadata || {}
            const score = meta.matchScore ?? 0
            const empresa = meta.jobData?.company || ''
            const titulo = meta.jobData?.title || 'Vacante'
            const fecha = new Date(item.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left"
              >
                <div className={`text-sm font-bold w-10 shrink-0 text-center ${score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                  {score}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{titulo}{empresa ? ` · ${empresa}` : ''}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{fecha}</div>
                </div>
                <ArrowRight size={13} className="text-gray-300 shrink-0" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
