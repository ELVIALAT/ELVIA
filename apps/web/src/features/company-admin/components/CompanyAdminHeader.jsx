// features/company-admin/components/CompanyAdminHeader.jsx
// Header del panel HR (logo tenant + identidad + tabs de navegación).
// Extraído verbatim desde pages/CompanyAdmin.jsx (Fase 3).
import { ChartBar, Gear, ListChecks, ShieldCheck, SignOut, UsersThree } from '@phosphor-icons/react'
import { useCompanyAdminCtx } from '../CompanyAdminContext'

export default function CompanyAdminHeader() {
  const { tenant, primary, secondary, perfil, user, logout, navigate, tab, setTab, invitations } = useCompanyAdminCtx()

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30 backdrop-blur-xl bg-white/90">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name} className="h-[48px] md:h-[54px] object-contain transition-all duration-300 hover:scale-105" />
          ) : (
            <div className="px-3 py-1.5 rounded-lg text-white text-sm font-bold" style={{ background: primary }}>
              {tenant.name}
            </div>
          )}
          <div className="h-6 w-px bg-gray-200" />
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <span>operado por</span>
            <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-4 md:h-5 object-contain opacity-80" />
          </div>
          <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
            <ShieldCheck size={14} className="text-emerald-500" weight="duotone" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Panel HR</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: secondary }}>
              {(perfil?.nombre1?.[0] || user?.email?.[0] || '?').toUpperCase()}
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900 text-xs leading-tight">{perfil?.nombre1 || user?.email}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-widest">Company Admin</div>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
            title="Cerrar sesión"
          >
            <SignOut size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center gap-1 border-t border-gray-50">
        {[
          { id: 'resumen',    label: 'Resumen',     icon: ChartBar },
          { id: 'personas',   label: 'Personas',    icon: UsersThree },
          { id: 'invitaciones', label: 'Seguimiento', icon: ListChecks },
          { id: 'config',     label: 'Configuración', icon: Gear },
        ].map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                active ? 'border-current text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
              style={active ? { borderColor: primary, color: primary } : undefined}
            >
              <t.icon size={15} weight={active ? 'fill' : 'regular'} />
              {t.label}
              {t.id === 'invitaciones' && invitations.length > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: `${primary}15`, color: primary }}
                >
                  {invitations.length}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </header>
  )
}
