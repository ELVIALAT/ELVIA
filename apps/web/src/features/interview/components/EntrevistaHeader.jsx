// features/interview/components/EntrevistaHeader.jsx
// Header del simulador (+ botón Salir durante la entrevista).
// Extraído verbatim desde pages/Entrevista.jsx (Fase 3).
import { ArrowLeft } from '@phosphor-icons/react'
import { useEntrevistaCtx } from '../EntrevistaContext'

export default function EntrevistaHeader() {
  const { paso, setConfirmSalir } = useEntrevistaCtx()
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Simulador de Entrevista</h1>
        </div>
        <p className="text-sm text-gray-500">Practica con ELVIA y recibe feedback profesional en tiempo real.</p>
      </div>
      {paso === 'entrevista' && (
        <button onClick={() => setConfirmSalir(true)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300 rounded-xl px-3 py-2 transition-colors">
          <ArrowLeft size={13} weight="bold" /> Salir
        </button>
      )}
    </div>
  )
}
