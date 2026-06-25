// features/company-admin/components/KpiCard.jsx
// Tarjeta de KPI. Componente puro (props). Extraído verbatim desde pages/CompanyAdmin.jsx.

export default function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}15`, color: accent }}
        >
          <Icon size={18} weight="duotone" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 leading-none mb-1">{value}</div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}
