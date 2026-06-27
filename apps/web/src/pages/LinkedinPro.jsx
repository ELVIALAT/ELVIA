// LinkedIn Optima — Validador y optimizador de perfil LinkedIn con IA
// Fase 3: descompuesto en features/linkedin/. El estado/efectos/handlers (carga,
// extracción PDF, análisis IA, informe PDF) viven en useLinkedinPro() y se proveen
// por LinkedinContext; ResultadoView/FormView consumen con useLinkedinCtx().
// El gate por progreso (FeatureLocked) va después del hook (era así en el original).
import { LinkedinLogo } from '@phosphor-icons/react'
import FeatureLocked from '../components/common/FeatureLocked'
import { useLinkedinPro } from '../features/linkedin/useLinkedinPro'
import { LinkedinContext } from '../features/linkedin/LinkedinContext'
import ResultadoView from '../features/linkedin/components/ResultadoView'
import FormView from '../features/linkedin/components/FormView'

export default function LinkedinOptima() {
  const lp = useLinkedinPro()

  // Bloqueo hasta completar el Gerente de Búsqueda al 100%
  if (!lp.isUnlockedByProgress) {
    return (
      <FeatureLocked
        titulo="LinkedIn Pro"
        descripcion="Optimiza tu presencia en la red profesional más grande del mundo con análisis de keywords y estructura de alto impacto."
        icono={<LinkedinLogo size={44} weight="light" className="text-[#0077B5]" />}
      />
    )
  }

  return (
    <LinkedinContext.Provider value={lp}>
      {lp.resultado ? <ResultadoView /> : <FormView />}
    </LinkedinContext.Provider>
  )
}
