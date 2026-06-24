// features/cv/CVWizardContext.jsx
// Context del wizard de la Factoría CV. El orquestador provee el API completo
// (estado + handlers) que construye useCVWizardState(); cada componente consume
// SOLO lo que necesita con useCVWizard(). Elimina el prop-drilling: agregar estado
// o un paso ya no requiere recablear capas intermedias.
import { createContext, useContext } from 'react'

export const CVWizardContext = createContext(null)

export function useCVWizard() {
  const ctx = useContext(CVWizardContext)
  if (ctx === null) {
    throw new Error('useCVWizard() debe usarse dentro de <CVWizardContext.Provider> (ver pages/CVDesdeCero.jsx)')
  }
  return ctx
}
