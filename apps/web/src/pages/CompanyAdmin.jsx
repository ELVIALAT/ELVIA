// CompanyAdmin — Panel del HR Director / Gestor de programa B2B
// Ruta: /empresa-admin · Solo accesible si profile.role === 'company_admin'
// Fase 3: descompuesto en features/company-admin/. El estado/guard/fetch/handlers
// viven en useCompanyAdmin() y se proveen por CompanyAdminContext; cada tab/header
// consume con useCompanyAdminCtx(). Los modales son props-puros (no context).
import { useCompanyAdmin } from '../features/company-admin/useCompanyAdmin'
import { CompanyAdminContext } from '../features/company-admin/CompanyAdminContext'
import CompanyAdminHeader from '../features/company-admin/components/CompanyAdminHeader'
import TabResumen from '../features/company-admin/components/TabResumen'
import TabPersonas from '../features/company-admin/components/TabPersonas'
import TabInvitaciones from '../features/company-admin/components/TabInvitaciones'
import TabConfig from '../features/company-admin/components/TabConfig'
import InviteModal from '../features/company-admin/components/InviteModal'
import CsvUploadModal from '../features/company-admin/components/CsvUploadModal'

export default function CompanyAdmin() {
  const ca = useCompanyAdmin()

  if (ca.authLoading || (ca.loading && !ca.company)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <CompanyAdminContext.Provider value={ca}>
      <div className="min-h-screen bg-gray-50">
        <CompanyAdminHeader />

        <main className="max-w-7xl mx-auto px-6 lg:px-10 py-8 md:py-12">
          {ca.tab === 'resumen' && <TabResumen />}
          {ca.tab === 'personas' && <TabPersonas />}
          {ca.tab === 'invitaciones' && <TabInvitaciones />}
          {ca.tab === 'config' && <TabConfig />}
        </main>

        {ca.showInviteModal && (
          <InviteModal
            onClose={() => ca.setShowInviteModal(false)}
            onSubmit={ca.handleInvite}
            primary={ca.primary}
          />
        )}

        {ca.showCsvModal && (
          <CsvUploadModal
            onClose={() => ca.setShowCsvModal(false)}
            onSubmit={ca.handleCsvBulk}
            primary={ca.primary}
            defaultCohort={ca.cohort || ''}
          />
        )}
      </div>
    </CompanyAdminContext.Provider>
  )
}
