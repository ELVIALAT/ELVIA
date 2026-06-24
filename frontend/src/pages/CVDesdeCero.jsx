// Wizard: Crear CV desde cero (orquestador)
// Fase 3: descompuesto en features/cv/ (1 componente por paso del wizard).
// El estado/efectos/persistencia viven en useCVWizardState() y se proveen por
// CVWizardContext; cada componente consume con useCVWizard() SOLO lo que necesita
// (sin prop-drilling). NO tocar shapes de persistencia (regla CLAUDE.md).
import { SpinnerGap } from '@phosphor-icons/react'
import { CVWizardContext, useCVWizard } from '../features/cv/CVWizardContext'
import { useCVWizardState } from '../features/cv/useCVWizard'
import WizardLayout from '../features/cv/components/WizardLayout'
import VistaCVGenerada from '../features/cv/components/VistaCVGenerada'
import PantallaSeleccion from '../features/cv/components/PantallaSeleccion'
import ModalBorradorPendiente from '../features/cv/components/ModalBorradorPendiente'
import AlertaCVExistente from '../features/cv/components/AlertaCVExistente'
import WizardModals from '../features/cv/components/WizardModals'

// Router: decide qué pantalla mostrar según el estado del wizard (vía context).
// Mismo orden de prioridad que el orquestador original.
function WizardRouter() {
  const { cvGenerada, inicializando, borradorPendiente, alertaExistente, pasoActual, modoSeleccion } = useCVWizard()

  // ── Vista: CV generado para revisión ───────────────────────────────────────
  if (cvGenerada) return <VistaCVGenerada />

  // ── Loading inicial ─────────────────────────────────────────────────────────
  if (inicializando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <SpinnerGap size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Cargando tu información...</p>
        </div>
      </div>
    )
  }

  // Borrador en BD entrando con mode='scratch' → solo el modal de decisión
  if (borradorPendiente) return <ModalBorradorPendiente />

  if (alertaExistente && pasoActual === 0) return <AlertaCVExistente />

  // ── Pantalla de selección de ruta (upload vs desde cero) ────────────────────
  if (modoSeleccion) return <PantallaSeleccion />

  // ── Wizard principal ────────────────────────────────────────────────────────
  return (
    <>
      <WizardLayout />
      <WizardModals />
    </>
  )
}

export default function CVDesdeCero() {
  const wizard = useCVWizardState()
  return (
    <CVWizardContext.Provider value={wizard}>
      <WizardRouter />
    </CVWizardContext.Provider>
  )
}
