// features/interview/components/LoadingEvalOverlay.jsx
// Overlay de "analizando entrevista" mientras se evalúa (fuera del paso feedback).
// Extraído verbatim desde pages/Entrevista.jsx (Fase 3).
import { Spinner } from '@phosphor-icons/react'
import { useEntrevistaCtx } from '../EntrevistaContext'

export default function LoadingEvalOverlay() {
  const { loadingEval, paso } = useEntrevistaCtx()
  if (!(loadingEval && paso !== 'feedback')) return null
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl max-w-xs mx-4">
        <Spinner size={40} className="animate-spin text-primary" />
        <p className="text-base font-bold text-gray-800 text-center">Analizando tu entrevista...</p>
        <p className="text-sm text-gray-500 text-center">ELVIA está evaluando tus respuestas</p>
      </div>
    </div>
  )
}
