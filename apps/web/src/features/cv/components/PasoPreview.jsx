// features/cv/components/PasoPreview.jsx
// PASO 6 del wizard — Vista Previa Harvard editable (borrador final antes de generar).
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import { Eye } from '@phosphor-icons/react'
import CVHarvardPreview from '../../../components/cv/CVHarvardPreview'
import { useCVWizard } from '../CVWizardContext'

export default function PasoPreview() {
  const { datos, borradorFinal, setBorradorFinal } = useCVWizard()
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
        <Eye size={18} weight="duotone" className="text-indigo-600" />
        <h2 className="text-base font-black text-slate-800">Borrador Final — Editable</h2>
      </div>

      {/* Disclaimer */}
      <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <span className="text-amber-500 text-lg leading-none mt-0.5">⚠️</span>
        <div>
          <p className="text-xs font-bold text-amber-800 mb-0.5">Lee con detenimiento antes de generar</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Puedes editar directamente cualquier campo del documento — haz clic sobre el texto. Los cambios aquí <strong>no modifican los pasos anteriores</strong>. Si vuelves al formulario y regresas, este borrador se reiniciará. <strong>Nota:</strong> esta es una vista previa simplificada; el formato final del documento (PDF y Word) es estilo Harvard.
          </p>
        </div>
      </div>

      {/* Contenedor scrollable con sombra de papel */}
      <div className="overflow-y-auto overflow-x-hidden max-h-[620px] rounded-xl border border-indigo-100 shadow-inner bg-slate-100 p-4">
        <CVHarvardPreview
          datos={borradorFinal || datos}
          editable={true}
          onChange={setBorradorFinal}
        />
      </div>
      <p className="text-[10px] text-slate-400 text-center">Los campos con subrayado azul punteado son editables</p>
    </div>
  )
}
