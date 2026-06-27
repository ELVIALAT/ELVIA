// components/cv-vs-job/CVVacioEstado.jsx
// Extraído verbatim desde pages/CVvsJob.jsx (Fase 3, archivos >800).
// Estado vacío cuando el usuario aún no tiene un CV optimizado.
import { FileText, ArrowRight } from '@phosphor-icons/react'

export default function CVVacioEstado({ onIrAlOptimizador }) {
  return (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
      <FileText size={42} className="text-slate-300 mx-auto mb-3" weight="light" />
      <p className="text-sm font-semibold text-slate-700 mb-1">Aún no tienes un CV optimizado</p>
      <p className="text-xs text-slate-500 mb-5 max-w-xs mx-auto">
        Para medir tu compatibilidad con vacantes, primero sube y optimiza tu CV con nuestra IA.
      </p>
      <button
        onClick={onIrAlOptimizador}
        className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
      >
        Ir al Optimizador de CV
        <ArrowRight size={16} weight="bold" />
      </button>
    </div>
  )
}
