// features/company-admin/CompanyAdminContext.jsx
// Context del panel HR. El orquestador provee el API completo de useCompanyAdmin();
// cada tab/header consume SOLO lo que necesita con useCompanyAdminCtx(). Mismo patrón
// que CVWizardContext / EntrevistaContext.
import { createContext, useContext } from 'react'

export const CompanyAdminContext = createContext(null)

export function useCompanyAdminCtx() {
  const ctx = useContext(CompanyAdminContext)
  if (ctx === null) {
    throw new Error('useCompanyAdminCtx() debe usarse dentro de <CompanyAdminContext.Provider> (ver pages/CompanyAdmin.jsx)')
  }
  return ctx
}
