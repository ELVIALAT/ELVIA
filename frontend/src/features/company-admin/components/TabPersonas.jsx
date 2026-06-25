// features/company-admin/components/TabPersonas.jsx
// Tab "Personas" — lista aprobada (allowlist) con KPIs, carga CSV/invitación y tabla.
// Extraído verbatim desde pages/CompanyAdmin.jsx (Fase 3).
import * as PI from '@phosphor-icons/react'
import { useCompanyAdminCtx } from '../CompanyAdminContext'

export default function TabPersonas() {
  const { allowlist, primary, secondary, setShowCsvModal, setShowInviteModal, handleRevoke, L } = useCompanyAdminCtx()

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personas del programa</h1>
          <p className="text-sm text-gray-500 mt-1">
            Lista aprobada de {L.members} que pueden acceder al programa.
            Solo personas en esta lista pueden activar cuenta.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: primary }}
          >
            <PI.UploadSimple size={16} weight="bold" />
            Cargar CSV
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            <PI.UserPlus size={16} weight="bold" />
            Invitar uno
          </button>
        </div>
      </div>

      {/* KPIs allowlist */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(() => {
          const total      = allowlist.length
          const activados  = allowlist.filter(a => a.status === 'activated').length
          const pendientes = allowlist.filter(a => a.status === 'pending' || a.status === 'invited').length
          const revocados  = allowlist.filter(a => a.status === 'revoked').length
          const adopcion   = total > 0 ? Math.round((activados / total) * 100) : 0
          return (
            <>
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Aprobados</div>
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
                <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Tasa de adopción</div>
                <div className="text-2xl font-bold" style={{ color: primary }}>{adopcion}%</div>
              </div>
            </>
          )
        })()}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {allowlist.length === 0 ? (
          <div className="p-16 text-center">
            <PI.UsersThree size={48} className="text-gray-300 mx-auto mb-3" weight="duotone" />
            <p className="text-sm font-semibold text-gray-700 mb-1">Aún no hay personas en la lista aprobada</p>
            <p className="text-xs text-gray-500 mb-5">Carga un CSV con los emails de tu cohorte o invita a uno manualmente.</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowCsvModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: primary }}
              >
                <PI.UploadSimple size={16} weight="bold" />
                Cargar CSV
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Persona</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Email</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Área</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Cohort</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Estado</th>
                  <th className="px-6 py-3 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allowlist.map(a => {
                  const statusStyle = a.status === 'activated'
                    ? 'bg-emerald-50 text-emerald-600'
                    : a.status === 'revoked'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-700'
                  const statusLabel = a.status === 'activated' ? 'Activado' : a.status === 'revoked' ? 'Revocado' : 'Pendiente'
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: secondary }}>
                            {(a.nombre?.[0] || a.email?.[0] || '?').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              {[a.nombre, a.apellido].filter(Boolean).join(' ') || <span className="text-gray-400">Sin nombre</span>}
                            </div>
                            {a.cargo_actual && <div className="text-xs text-gray-400">{a.cargo_actual}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{a.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{a.area || '—'}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 font-mono">{a.cohort || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRevoke(a.id, a.status)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-900 underline"
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
