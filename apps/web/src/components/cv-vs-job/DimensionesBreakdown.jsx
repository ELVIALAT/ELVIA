// components/cv-vs-job/DimensionesBreakdown.jsx
// Extraído verbatim desde pages/CVvsJob.jsx (Fase 3, archivos >800).
// Desglose por dimensión (hard/soft skills, experiencia, formato ATS) con barras de progreso.

export default function DimensionesBreakdown({ dimensiones }) {
  if (!dimensiones) return null
  const dims = [
    { key: 'hard_skills', label: 'Hard Skills', color: 'bg-violet-500' },
    { key: 'soft_skills', label: 'Soft Skills', color: 'bg-blue-500' },
    { key: 'experiencia', label: 'Experiencia', color: 'bg-emerald-500' },
    { key: 'formato_ats', label: 'Formato ATS', color: 'bg-amber-500' },
  ]
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desglose por dimensión</h3>
      {dims.map(d => {
        const val = dimensiones[d.key]
        if (val === null || val === undefined) return null
        return (
          <div key={d.key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">{d.label}</span>
              <span className={`text-xs font-bold ${val >= 75 ? 'text-emerald-600' : val >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{val}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${d.color} rounded-full transition-all`} style={{ width: `${val}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
