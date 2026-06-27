// features/cv/components/PasoIdiomas.jsx
// PASO 5 del wizard — Idiomas (con nivel CEFR e idiomas detectados del CV).
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import HelpBadge from '../../../components/common/HelpBadge'
import { IDIOMAS_LIST, NIVELES_CEFR } from '../constants'
import { useCVWizard } from '../CVWizardContext'

export default function PasoIdiomas() {
  const { datos, setDatos, upNivIdm, togIdm, tipsPorPaso } = useCVWizard()
  const tips = tipsPorPaso.idiomas
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
        <h2 className="text-base font-bold text-slate-800">Idiomas</h2>
        <HelpBadge id="cvdesdecero.idiomas" />
      </div>
      <p className="text-sm text-slate-600">Idiomas que dominas</p>
      <div className="space-y-2">
        {/* Idiomas detectados del CV que no están en la lista estándar */}
        {(datos.idiomas || []).filter(i => i.detectedFromCV && !IDIOMAS_LIST.includes(i.idioma)).map(item => (
          <div key={item.idioma} className="flex items-center gap-3 border border-blue-200 bg-blue-50/40 rounded-lg p-3">
            <input type="checkbox" checked onChange={() => setDatos(f => ({ ...f, idiomas: f.idiomas.filter(x => x.idioma !== item.idioma) }))}
              className="w-4 h-4 cursor-pointer accent-blue-600" />
            <span className="flex-1 text-sm font-medium text-slate-700">{item.idioma}</span>
            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">Del CV</span>
            <select
              value={item.nivel || ''}
              onChange={e => upNivIdm(item.idioma, e.target.value)}
              className={`border rounded-lg px-2 py-1 text-xs focus:outline-none ${!item.nivel ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-300'}`}>
              <option value="" disabled>Seleccionar...</option>
              {NIVELES_CEFR.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        ))}
        {IDIOMAS_LIST.map(idioma => {
          const entry = datos.idiomas?.find(i => i.idioma === idioma)
          const isChecked = !!entry
          const isFromCV = entry?.detectedFromCV
          const nivelActual = entry?.nivel
          return (
            <div key={idioma} className={`flex items-center gap-3 border rounded-lg p-3 ${isFromCV ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200'}`}>
              <input type="checkbox" checked={isChecked}
                onChange={() => togIdm(idioma)} className="w-4 h-4 cursor-pointer accent-blue-600" />
              <span className="flex-1 text-sm font-medium text-slate-700">{idioma}</span>
              {isFromCV && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0">Del CV</span>}
              {isChecked && (
                <select
                  value={nivelActual || ''}
                  onChange={e => upNivIdm(idioma, e.target.value)}
                  className={`border rounded-lg px-2 py-1 text-xs focus:outline-none ${!nivelActual ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-300'}`}>
                  {!nivelActual && <option value="" disabled>Seleccionar...</option>}
                  {NIVELES_CEFR.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
            </div>
          )
        })}
      </div>
      {tips.length > 0 && (
        <div className="mt-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-bold text-amber-800 mb-1.5">💡 Tips para mejorar esta sección:</p>
          <ul className="space-y-1">{tips.map((t,i)=><li key={i} className="text-xs text-amber-700 flex gap-1.5"><span className="shrink-0">→</span><span>{t}</span></li>)}</ul>
        </div>
      )}
    </div>
  )
}
