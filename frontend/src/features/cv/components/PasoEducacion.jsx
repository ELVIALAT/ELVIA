// features/cv/components/PasoEducacion.jsx
// PASO 3 del wizard — Educación.
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import HelpBadge from '../../../components/common/HelpBadge'
import { X, Plus } from '@phosphor-icons/react'
import { useCVWizard } from '../CVWizardContext'

export default function PasoEducacion() {
  const { datos, delEdu, upEdu, addEdu, tipsPorPaso } = useCVWizard()
  const tips = tipsPorPaso.educacion
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
        <h2 className="text-base font-bold text-slate-800">Educación</h2>
        <HelpBadge id="cvdesdecero.educacion" />
      </div>
      {datos.educacion.map((edu, i) => (
        <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-slate-700 text-sm">Educación {i + 1}</h4>
            {datos.educacion.length > 1 && (
              <button onClick={() => delEdu(i)} className="text-red-500 hover:text-red-700 cursor-pointer"><X size={16} /></button>
            )}
          </div>
          <input placeholder="Institución / University" value={edu.institucion} onChange={e => upEdu(i, 'institucion', e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Título / Degree" value={edu.titulo} onChange={e => upEdu(i, 'titulo', e.target.value)}
              className="col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
            <input placeholder="Año" value={edu.anio} onChange={e => upEdu(i, 'anio', e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
          </div>
        </div>
      ))}
      <button onClick={addEdu} className="w-full border-2 border-dashed border-blue-300 text-blue-600 font-bold py-2.5 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 text-sm cursor-pointer">
        <Plus size={16} /> Agregar educación
      </button>
      {tips.length > 0 && (
        <div className="mt-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-bold text-amber-800 mb-1.5">💡 Tips para mejorar esta sección:</p>
          <ul className="space-y-1">{tips.map((t,i)=><li key={i} className="text-xs text-amber-700 flex gap-1.5"><span className="shrink-0">→</span><span>{t}</span></li>)}</ul>
        </div>
      )}
    </div>
  )
}
