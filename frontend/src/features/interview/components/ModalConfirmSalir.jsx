// features/interview/components/ModalConfirmSalir.jsx
// Modal de confirmación para salir de la entrevista en curso.
// Extraído verbatim desde pages/Entrevista.jsx (Fase 3).
import { useEntrevistaCtx } from '../EntrevistaContext'

export default function ModalConfirmSalir() {
  const { confirmSalir, setConfirmSalir, reiniciar } = useEntrevistaCtx()
  if (!confirmSalir) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <h3 className="text-base font-bold text-gray-900">¿Salir de la entrevista?</h3>
        <p className="text-sm text-gray-500">Se perderá todo el progreso de esta sesión, incluyendo tus respuestas.</p>
        <div className="flex gap-3 pt-1">
          <button onClick={() => setConfirmSalir(false)}
            className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:border-gray-400 transition-colors text-sm">
            Continuar entrevista
          </button>
          <button onClick={reiniciar}
            className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm">
            Sí, salir
          </button>
        </div>
      </div>
    </div>
  )
}
