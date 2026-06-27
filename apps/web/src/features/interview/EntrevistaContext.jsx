// features/interview/EntrevistaContext.jsx
// Context del Simulador de Entrevista. EntrevistaApp provee el API completo
// (estado + handlers) de useEntrevista(); cada componente consume SOLO lo que
// necesita con useEntrevistaCtx(). Mismo patrón que CVWizardContext.
import { createContext, useContext } from 'react'

export const EntrevistaContext = createContext(null)

export function useEntrevistaCtx() {
  const ctx = useContext(EntrevistaContext)
  if (ctx === null) {
    throw new Error('useEntrevistaCtx() debe usarse dentro de <EntrevistaContext.Provider> (ver features/interview/EntrevistaApp.jsx)')
  }
  return ctx
}
