// features/career-project/components/SkillsAccordionPicker.jsx
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 3).
import { useState } from 'react'
import { CaretDown } from '@phosphor-icons/react'

export default function SkillsAccordionPicker({ tema, categorias, seleccion, onToggle, icon, titulo, subtitulo }) {
  const [query, setQuery] = useState('')
  // Mantenemos el estado abierto/cerrado en memoria por categoría para evitar que cerrar una
  // afecte a las demás. Por defecto todas inician cerradas para reducir saturación visual.
  const [abiertas, setAbiertas] = useState({})
  const esHard = tema === 'hard'

  const paleta = esHard
    ? { bg: 'bg-blue-50',    borde: 'border-blue-100',    chip: 'bg-blue-600',    chipText: 'text-blue-600',    badgeBg: 'bg-blue-100' }
    : { bg: 'bg-emerald-50', borde: 'border-emerald-100', chip: 'bg-emerald-600', chipText: 'text-emerald-600', badgeBg: 'bg-emerald-100' }

  const total = seleccion.length
  const excedido = total > 6
  const contadorClass = excedido
    ? 'text-rose-600'
    : total === 6
      ? 'text-emerald-700'
      : 'text-slate-600'

  const queryNorm = query.trim().toLowerCase()

  return (
    <div className={`p-5 rounded-2xl ${paleta.bg} border ${paleta.borde}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg ${paleta.badgeBg} border ${paleta.borde} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="font-bold text-slate-800 text-sm leading-tight">{titulo}</div>
          <div className={`text-xs font-medium ${paleta.chipText}`}>{subtitulo}</div>
        </div>
        <div className={`text-xs font-black uppercase tracking-widest ${contadorClass}`}>
          {total} / 6
        </div>
      </div>

      {/* Buscador */}
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar habilidad..."
        className="w-full mb-3 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
      />

      {/* Si el usuario excede la recomendación, lo avisamos con tono suave (no bloqueamos). */}
      {excedido ? (
        <div className="mb-3 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          Llevas {total} seleccionadas. Lo ideal son 6 — prioriza las más alineadas a tu objetivo.
        </div>
      ) : null}

      {/* Acordeón categorizado */}
      <div className="space-y-2">
        {Object.entries(categorias).map(([cat, items]) => {
          const visibles = queryNorm
            ? items.filter(it => it.toLowerCase().includes(queryNorm))
            : items
          if (visibles.length === 0) return null
          const seleccionadasEnCat = items.filter(it => seleccion.includes(it)).length
          // Si hay búsqueda activa, expandimos todas las categorías que tienen matches.
          const expandida = queryNorm ? true : (abiertas[cat] || false)
          return (
            <div key={cat} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setAbiertas(prev => ({ ...prev, [cat]: !prev[cat] }))}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-bold text-slate-800">{cat}</span>
                <span className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${seleccionadasEnCat > 0 ? paleta.chipText : 'text-slate-400'}`}>
                    {seleccionadasEnCat} / {items.length}
                  </span>
                  <CaretDown size={14} className={`text-slate-400 transition-transform ${expandida ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {expandida ? (
                <div className="px-4 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {visibles.map(item => {
                    const sel = seleccion.includes(item)
                    return (
                      <label
                        key={item}
                        className={`flex items-start gap-2.5 cursor-pointer p-2 rounded-lg transition-colors ${sel ? `${paleta.bg}` : 'hover:bg-slate-50'}`}
                      >
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => onToggle(item)}
                          className={`mt-0.5 w-4 h-4 rounded ${esHard ? 'accent-blue-600' : 'accent-emerald-600'} cursor-pointer`}
                        />
                        <span className={`text-xs leading-snug ${sel ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                          {item}
                        </span>
                      </label>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
        {queryNorm && Object.values(categorias).flat().filter(it => it.toLowerCase().includes(queryNorm)).length === 0 ? (
          <div className="text-xs text-slate-400 italic text-center py-4">
            Sin resultados para "{query}".
          </div>
        ) : null}
      </div>
    </div>
  )
}
