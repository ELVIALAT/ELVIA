// features/company-admin/components/TabConfig.jsx
// Tab "Configuración" — datos del tenant + compliance & seguridad.
// Extraído verbatim desde pages/CompanyAdmin.jsx (Fase 3).
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, ShieldCheck } from '@phosphor-icons/react'
import { useCompanyAdminCtx } from '../CompanyAdminContext'

export default function TabConfig() {
  const { company, primary, L } = useCompanyAdminCtx()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración del programa</h1>
        <p className="text-sm text-gray-500 mt-1">Información del tenant y compliance.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">{L.orgData}</h3>
        <dl className="grid sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Nombre</dt><dd className="text-gray-900 font-semibold">{company?.name || '—'}</dd></div>
          <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Slug</dt><dd className="text-gray-900 font-mono text-xs">/{company?.slug || '—'}</dd></div>
          <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Sector</dt><dd className="text-gray-900 font-semibold capitalize">{company?.sector || '—'}</dd></div>
          <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">País</dt><dd className="text-gray-900 font-semibold">{company?.country || '—'}</dd></div>
          <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Plan</dt><dd className="text-gray-900 font-semibold capitalize">{company?.plan || '—'}</dd></div>
          <div><dt className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Estado</dt><dd className={`font-semibold ${company?.is_active ? 'text-emerald-600' : 'text-red-600'}`}>{company?.is_active ? 'Activa' : 'Inactiva'}</dd></div>
        </dl>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-500" weight="duotone" />
          Compliance & Seguridad
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" weight="fill" /> Aislamiento estricto por tenant (RLS Postgres)</li>
          <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" weight="fill" /> Cifrado en tránsito (TLS 1.3) y en reposo</li>
          <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" weight="fill" /> Audit log de todas las acciones administrativas</li>
          <li className="flex items-start gap-2"><CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" weight="fill" /> Sin acceso a datos individuales de {L.members}</li>
        </ul>
        <Link
          to="/privacidad"
          className="inline-flex items-center gap-1 text-xs font-semibold mt-4 hover:underline"
          style={{ color: primary }}
        >
          Ver política completa de privacidad <ArrowRight size={12} weight="bold" />
        </Link>
      </div>
    </div>
  )
}
