// features/cv/components/PasoHabilidades.jsx
// PASO 4 del wizard — Competencias y habilidades.
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import HelpBadge from '../../../components/common/HelpBadge'
import { X, Plus } from '@phosphor-icons/react'

export default function PasoHabilidades({ datos, togHab, nuevaHab, setNuevaHab, addHab, tips }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
        <h2 className="text-base font-bold text-slate-800">Competencias y Habilidades</h2>
        <HelpBadge id="cvdesdecero.habilidades" />
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        Estas son las competencias seleccionadas en tu pilar <span className="font-bold text-indigo-600">Competencias</span> del Gerente de Proyecto. Puedes quitar las que no quieras incluir en este CV o agregar habilidades adicionales.
      </p>

      {/* Habilidades del usuario (vienen del Gerente o agregadas aquí) */}
      {datos.habilidades.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {datos.habilidades.map(h => (
            <span key={h} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white">
              {h}
              <button onClick={() => togHab(h)} className="cursor-pointer ml-0.5 opacity-70 hover:opacity-100 hover:bg-white/20 rounded-full" title="Quitar de este CV"><X size={11} weight="bold" /></button>
            </span>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-500 text-center">
          No tienes habilidades cargadas. Agrégalas debajo o ve al pilar Competencias para seleccionarlas.
        </div>
      )}

      {/* Agregar habilidad personalizada */}
      <div className="flex gap-2">
        <input type="text" placeholder="Agregar habilidad adicional..." value={nuevaHab}
          onChange={e => setNuevaHab(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addHab(nuevaHab)}
          className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
        <button onClick={() => addHab(nuevaHab)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 cursor-pointer">
          <Plus size={16} />
        </button>
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
