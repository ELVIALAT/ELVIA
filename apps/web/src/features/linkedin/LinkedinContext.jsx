// features/linkedin/LinkedinContext.jsx
// Context de LinkedIn Optima. El orquestador provee el API de useLinkedinPro();
// ResultadoView/FormView consumen con useLinkedinCtx(). Mismo patrón que los demás.
import { createContext, useContext } from 'react'

export const LinkedinContext = createContext(null)

export function useLinkedinCtx() {
  const ctx = useContext(LinkedinContext)
  if (ctx === null) {
    throw new Error('useLinkedinCtx() debe usarse dentro de <LinkedinContext.Provider> (ver pages/LinkedinPro.jsx)')
  }
  return ctx
}
