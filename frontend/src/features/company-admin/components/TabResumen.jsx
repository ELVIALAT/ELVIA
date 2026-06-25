// features/company-admin/components/TabResumen.jsx
// Tab "Resumen" — KPIs, funnel, engagement, adopción por área, outcomes, uso agregado.
// Extraído verbatim desde pages/CompanyAdmin.jsx (Fase 3); el IIFE original pasa a ser
// el cuerpo del componente (mismos cálculos derivados al tope + JSX idéntico).
import * as PI from '@phosphor-icons/react'
import KpiCard from './KpiCard'
import { useCompanyAdminCtx } from '../CompanyAdminContext'

export default function TabResumen() {
  const { allowlist, users, primary, secondary, cohort, tenant, company, stats, L } = useCompanyAdminCtx()

  // ── KPIs derivados de los datos en memoria ──
  const invitados    = allowlist.length
  const activados    = allowlist.filter(a => a.status === 'activated').length
  const adopcion     = invitados > 0 ? Math.round((activados / invitados) * 100) : 0
  const conCV        = users.filter(u => (u.cv_optimizer_count || 0) > 0).length
  const conMatch     = users.filter(u => (u.cv_match_count || 0) > 0).length
  const enBusqueda   = users.filter(u => (u.usage_count || 0) >= 10).length
  const empleados    = users.filter(u => u.hired_at).length
  const empleadosList = users.filter(u => u.hired_at).slice(0, 10)

  // Top engagement (top 5 por usage_count, NO mostramos PII detallada solo iniciales+area)
  const topUsers = [...users].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 5)

  // Breakdown por area: join entre allowlist activated + users
  const areaCounts = {}
  allowlist.filter(a => a.status === 'activated' && a.area).forEach(a => {
    areaCounts[a.area] = (areaCounts[a.area] || 0) + 1
  })
  const areaArr = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])
  const maxArea = Math.max(1, ...Object.values(areaCounts))

  // Funnel
  const funnelSteps = [
    { label: 'Invitados',          value: invitados,                                              color: '#94A3B8' },
    { label: 'Activados',          value: activados,                                              color: primary },
    { label: 'CV listo',           value: conCV,                                                  color: '#3B82F6' },
    { label: 'Analizan vacantes',  value: conMatch,                                               color: '#8B5CF6' },
    { label: 'En busqueda activa', value: enBusqueda,                                             color: '#F59E0B' },
    { label: L.successMetric,      value: empleados,                                              color: '#10B981' },
  ]
  const funnelMax = Math.max(1, ...funnelSteps.map(s => s.value))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          Programa <span style={{ color: primary }}>{company?.name || tenant.name}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Métricas agregadas anónimas del programa de {L.programPurpose}.
          No accedes a CVs, conversaciones, ni postulaciones individuales.
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={PI.UsersThree} label={L.membersActiveLabel} value={activados}            sub={`de ${invitados} invitados`}        accent={primary} />
        <KpiCard icon={PI.TrendUp}    label="Tasa de adopción"      value={`${adopcion}%`}      sub="Activos / Invitados"               accent="#F59E0B" />
        <KpiCard icon={PI.FileText}   label="CVs generados"         value={stats.cvOptimizerUse || 0} sub={`${conCV} ${L.members} con CV`} accent="#8B5CF6" />
        <KpiCard icon={PI.Confetti}   label={L.successMetric}        value={empleados}           sub={empleados > 0 ? 'Felicidades 🎉' : L.successProcess}      accent="#10B981" />
      </div>

      {/* Funnel del programa */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Funnel del programa</h3>
            <p className="text-xs text-gray-500">Progreso de la cohorte por etapa de la transición.</p>
          </div>
          <div className="text-xs text-gray-400 font-mono">{cohort || tenant.slug}</div>
        </div>
        <div className="space-y-3">
          {funnelSteps.map((s, i) => {
            const pct = funnelMax > 0 ? Math.round((s.value / funnelMax) * 100) : 0
            const pctOfTop = invitados > 0 ? Math.round((s.value / invitados) * 100) : 0
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-gray-700">{s.label}</span>
                  <span className="text-gray-400">
                    <span className="font-bold text-gray-900 mr-1">{s.value}</span>
                    ({pctOfTop}% de invitados)
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: s.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Grid: Engagement + Sector */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Top engagement */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-base font-bold text-gray-900 mb-1">Mayor engagement</h3>
          <p className="text-xs text-gray-500 mb-5">Top 5 por sesiones acumuladas en la plataforma.</p>
          {topUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">Sin datos de uso aún.</div>
          ) : (
            <div className="space-y-3">
              {topUsers.map((u, i) => {
                const initials = ((u.nombre1 || '?')[0] + (u.apellido1 || '')[0]).toUpperCase()
                const max = topUsers[0]?.usage_count || 1
                const pct = Math.round(((u.usage_count || 0) / max) * 100)
                return (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: secondary }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-700 truncate">
                        {u.nombre1} {u.apellido1?.[0]}.
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: primary }} />
                      </div>
                    </div>
                    <div className="text-xs font-bold text-gray-900 shrink-0">{u.usage_count || 0} <span className="text-gray-400 font-normal">sesiones</span></div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sector breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-base font-bold text-gray-900 mb-1">Adopción por área</h3>
          <p className="text-xs text-gray-500 mb-5">Activados por área dentro de la cohorte.</p>
          {areaArr.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">Carga el CSV con área para ver el breakdown.</div>
          ) : (
            <div className="space-y-3">
              {areaArr.map(([area, count]) => {
                const pct = Math.round((count / maxArea) * 100)
                return (
                  <div key={area}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-gray-700">{area}</span>
                      <span className="font-bold text-gray-900">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: primary }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Empleados — outcomes destacados */}
      {empleadosList.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-700 shrink-0">
              <PI.Confetti size={20} weight="duotone" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900">Outcomes del programa</h3>
              <p className="text-xs text-gray-500">
                <strong className="text-emerald-700">{empleados} {L.members}</strong> {L.successAchieved}.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {empleadosList.map(u => (
              <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: '#10B981' }}>
                    {(u.nombre1?.[0] || '?').toUpperCase()}
                  </div>
                  <div className="text-xs font-semibold text-gray-900 truncate">
                    {u.nombre1} {u.apellido1?.[0]}.
                  </div>
                </div>
                <div className="text-xs text-gray-500 truncate">→ {u.hired_company || 'Empresa no reportada'}</div>
                {u.hired_at && (
                  <div className="text-[10px] text-gray-400 mt-1">
                    {new Date(u.hired_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidencialidad recordatorio */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
          <PI.ShieldCheck size={20} weight="duotone" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Tu rol como administrador del programa</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Como administrador, puedes invitar {L.members}, ver métricas de uso agregadas y exportar reportes.
            <strong className="text-gray-700"> No tienes acceso a los CVs, mensajes con el bot, ni postulaciones individuales</strong> — eso es estrictamente confidencial entre cada {L.member} y ELVIA®.
          </p>
        </div>
      </div>

      {/* Breakdown de uso */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-5">Uso por herramienta (agregado)</h3>
        <div className="space-y-4">
          {[
            { label: 'CV Optimizer',  value: stats.cvOptimizerUse || 0, max: Math.max(20, (stats.cvOptimizerUse || 0) * 1.2), color: primary },
            { label: 'CV vs Vacante', value: stats.cvMatchUse || 0,     max: Math.max(20, (stats.cvMatchUse || 0) * 1.2),     color: '#10B981' },
          ].map((row, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-700">{row.label}</span>
                <span className="font-bold text-gray-900">{row.value}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (row.value / row.max) * 100)}%`, background: row.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
