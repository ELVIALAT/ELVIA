// features/interview/EntrevistaApp.jsx
// App interna del Simulador: llama useEntrevista() (todo el estado/efectos pesados),
// provee el EntrevistaContext y enruta entre las 3 pantallas. Se monta SOLO cuando el
// gate (pages/Entrevista.jsx) confirmó que la feature está desbloqueada — por eso los
// efectos (queries supabase, voces, etc.) corren igual que en el original (que los
// registraba después de los early-returns de bloqueo).
import { useEntrevista } from './useEntrevista'
import { EntrevistaContext } from './EntrevistaContext'
import EntrevistaHeader from './components/EntrevistaHeader'
import ModalConfirmSalir from './components/ModalConfirmSalir'
import LoadingEvalOverlay from './components/LoadingEvalOverlay'
import PasoSetup from './components/PasoSetup'
import PasoEntrevista from './components/PasoEntrevista'
import PasoFeedback from './components/PasoFeedback'

export default function EntrevistaApp() {
  const ent = useEntrevista()

  if (!ent.user) return (
    <div className="max-w-2xl mx-auto px-6 py-20 text-center">
      <p className="text-gray-500 mb-4">Necesitas iniciar sesión para usar esta función.</p>
      <button onClick={() => ent.navigate('/auth')} className="btn-primary">Iniciar sesión</button>
    </div>
  )

  return (
    <EntrevistaContext.Provider value={ent}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <ModalConfirmSalir />
        <EntrevistaHeader />
        {ent.paso === 'setup' && <PasoSetup />}
        {ent.paso === 'entrevista' && ent.preguntaActual && <PasoEntrevista />}
        {ent.paso === 'feedback' && ent.evaluacion && <PasoFeedback />}
        <LoadingEvalOverlay />
      </div>
    </EntrevistaContext.Provider>
  )
}
