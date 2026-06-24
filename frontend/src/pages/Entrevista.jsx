// Entrevista — práctica de entrevistas con IA (funcionalidad premium)
// Fase 3: descompuesto en features/interview/. Este orquestador es solo el GATE
// (bloqueo por features + page_view); el estado/efectos/handlers viven en
// useEntrevista() y se proveen por EntrevistaContext dentro de EntrevistaApp.
// El gate corre sus hooks (useAuth/track/page_view) SIEMPRE antes del early-return,
// preservando el comportamiento original (page_view se trackea aunque esté bloqueado;
// los efectos pesados sólo corren cuando EntrevistaApp se monta = desbloqueado).
import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTrackEvent } from '../hooks/useTrackEvent'
import { MicrophoneStage } from '@phosphor-icons/react'
import FeatureLocked from '../components/common/FeatureLocked'
import EntrevistaApp from '../features/interview/EntrevistaApp'

export default function Entrevista() {
  const { featuresDesbloqueadas, loading: authLoading } = useAuth()
  const track = useTrackEvent()
  useEffect(() => { track('page_view', 'entrevista') }, [])

  // Bloqueo hasta completar el Gerente de Búsqueda al 100%
  if (authLoading) return null

  if (!featuresDesbloqueadas) {
    return (
      <FeatureLocked
        titulo="Preparación para Entrevistas"
        descripcion="Practica entrevistas simuladas con IA, recibe feedback personalizado y llega preparado a cualquier proceso de selección."
        icono={<MicrophoneStage size={40} className="text-on-surface-variant/60" />}
      />
    )
  }

  return <EntrevistaApp />
}
