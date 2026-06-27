// features/company-admin/components/TabInvitaciones.jsx
// Tab "Seguimiento" — estado de todos los invitados al programa (mini KPIs + tabla).
// Extraído verbatim desde pages/CompanyAdmin.jsx (Fase 3); el IIFE original pasa a ser
// el cuerpo del componente.
import { CheckCircle, Clock, PaperPlaneTilt, ProhibitInset, UserPlus } from '@phosphor-icons/react'
import { useCompanyAdminCtx } from '../CompanyAdminContext'

export default function TabInvitaciones() {
  const { allowlist, invitations, primary, secondary, setShowInviteModal, handleRevoke } = useCompanyAdminCtx()

  const total      = allowlist.length
  const activados  = allowlist.filter(a => a.status === 'activated').length
  const pendientes = allowlist.filter(a => a.status === 'pending' || a.status === 'invited').length
  const inactivos  = allowlist.filter(a => a.status === 'revoked').length

  // Enriquecer allowlist con datos de la invitación (expires_at, created_at) por email
  const invMap = Object.fromEntries(invitations.map(i => [i.email, i]))

  const statusCfg = {
    activated: { label: 'Activado',  bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle,  iconColor: 'text-emerald-500' },
    pending:   { label: 'Invitado',  bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Clock,        iconColor: 'text-amber-500'   },
    invited:   { label: 'Invitado',  bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Clock,        iconColor: 'text-amber-500'   },
    revoked:   { label: 'Inactivo',  bg: 'bg-gray-100',   text: 'text-gray-500',    icon: ProhibitInset, iconColor: 'text-gray-400'   },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seguimiento de participantes</h1>
          <p className="text-sm text-gray-500 mt-1">Estado de todos los invitados al programa.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          style={{ background: primary }}
        >
          <PaperPlaneTilt size={16} weight="bold" />
          Nueva invitación
        </button>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Total invitados</div>
          <div className="text-2xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Activados</div>
          <div className="text-2xl font-bold text-emerald-600">{activados}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Pendientes</div>
          <div className="text-2xl font-bold text-amber-600">{pendientes}</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Inactivos</div>
          <div className="text-2xl font-bold text-gray-400">{inactivos}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {allowlist.length === 0 ? (
          <div className="p-16 text-center">
            <UserPlus size={48} className="text-gray-300 mx-auto mb-3" weight="duotone" />
            <p className="text-sm font-semibold text-gray-700 mb-1">Sin participantes aún</p>
            <p className="text-xs text-gray-500 mb-5">Invita personas manualmente o carga un CSV desde la pestaña Personas.</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: primary }}
            >
              <PaperPlaneTilt size={16} weight="bold" />
              Nueva invitación
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Participante</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Estado</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Invitado</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Activado</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Vence</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...allowlist].sort((a, b) => new Date(b.added_at) - new Date(a.added_at)).map(a => {
                  const cfg = statusCfg[a.status] || statusCfg.pending
                  const StatusIcon = cfg.icon
                  const inv = invMap[a.email]
                  const invDate = a.added_at ? new Date(a.added_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'
                  const actDate = a.activated_at ? new Date(a.activated_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: secondary }}>
                            {(a.nombre?.[0] || a.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 text-sm">
                              {[a.nombre, a.apellido].filter(Boolean).join(' ') || <span className="text-gray-400 italic">Sin nombre</span>}
                            </div>
                            <div className="text-xs text-gray-400 font-mono truncate">{a.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${cfg.bg} ${cfg.text}`}>
                          <StatusIcon size={12} weight="bold" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{invDate}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {a.status === 'activated' ? <span className="text-emerald-600 font-semibold">{actDate}</span> : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {a.license_expires_at
                          ? (() => {
                              const exp = new Date(a.license_expires_at)
                              const soon = exp - new Date() < 14 * 24 * 3600 * 1000
                              const expired = exp < new Date()
                              return (
                                <span className={expired ? 'text-red-500 font-bold' : soon ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                                  {exp.toLocaleDateString('es', { day: '2-digit', month: 'short', year: '2-digit' })}
                                  {expired && ' ⚠️'}
                                </span>
                              )
                            })()
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRevoke(a.id, a.status)}
                          className="text-xs font-semibold text-gray-400 hover:text-gray-700 underline"
                        >
                          {a.status === 'revoked' ? 'Restablecer' : 'Revocar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
