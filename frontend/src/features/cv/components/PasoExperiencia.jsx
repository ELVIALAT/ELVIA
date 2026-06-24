// features/cv/components/PasoExperiencia.jsx
// PASO 2 del wizard — Experiencia laboral (+ optimización IA por experiencia).
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import HelpBadge from '../../../components/common/HelpBadge'
import { X, Plus, MagicWand, SpinnerGap, CheckFat } from '@phosphor-icons/react'
import { renderDiff } from '../diff'

export default function PasoExperiencia({
  datos, delExp, upExp, addExp, handleOptimizarExp, expOptimizando,
  expSugeridas, expMejoradas, aplicarSugerenciaExp, rechazarSugerenciaExp,
  setExpSugeridas, tips,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
        <h2 className="text-base font-bold text-slate-800">Experiencia Laboral</h2>
        <HelpBadge id="cvdesdecero.experiencia" />
      </div>
      {datos.experiencias.map((exp, i) => (
        <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-700 text-sm">Experiencia {i + 1}</h4>
              {i === 0 && <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">más reciente</span>}
            </div>
            {datos.experiencias.length > 1 && (
              <button onClick={() => delExp(i)} className="text-red-500 hover:text-red-700 cursor-pointer"><X size={16} /></button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Empresa" value={exp.empresa} onChange={e => upExp(i, 'empresa', e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
            <input placeholder="Cargo / Title" value={exp.cargo} onChange={e => upExp(i, 'cargo', e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Fecha inicio (ej: Jan 2020)" value={exp.fecha_inicio} onChange={e => upExp(i, 'fecha_inicio', e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
            <input placeholder="Fecha fin (ej: Present)" value={exp.fecha_fin} onChange={e => upExp(i, 'fecha_fin', e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
          </div>
          {/* Descripción + botón de mejora */}
          <textarea placeholder="Descripción y logros (en el idioma del CV)..." value={exp.descripcion} onChange={e => upExp(i, 'descripcion', e.target.value)}
            rows={Math.max(3, (exp.descripcion || '').split('\n').length + 1)}
            style={{ whiteSpace: 'pre-wrap' }}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none leading-relaxed" />

          <div className="flex items-center justify-between">
            <button
              onClick={() => handleOptimizarExp(i)}
              disabled={expOptimizando[i] || !exp.descripcion || exp.descripcion.length < 10 || !!expSugeridas[i] || !!expMejoradas[i]}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${expOptimizando[i] ? 'bg-slate-100 text-slate-400' : expMejoradas[i] ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100'} disabled:opacity-40`}
            >
              {expOptimizando[i] ? <SpinnerGap size={14} className="animate-spin" /> : expMejoradas[i] ? <CheckFat size={14} weight="fill" /> : <MagicWand size={14} weight="bold" />}
              {expOptimizando[i] ? 'Analizando...' : expMejoradas[i] ? 'Ya mejorado' : 'Mejorar con ELVIA'}
            </button>
            <span className={`text-[10px] ${exp.descripcion.length >= 600 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>{exp.descripcion.length} chars</span>
          </div>

          {/* Panel de sugerencia */}
          {expSugeridas[i] && (
            <div className="p-4 bg-indigo-50/40 border-2 border-dashed border-indigo-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MagicWand size={15} weight="fill" className="text-indigo-600" />
                  <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">Sugerencia IA (editable)</span>
                </div>
                <button onClick={() => rechazarSugerenciaExp(i)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>

              {/* Diff visual */}
              <div className="p-2.5 bg-white/70 rounded-lg text-xs leading-relaxed text-slate-600 border border-indigo-50">
                <p className="font-bold text-[10px] text-indigo-400 uppercase mb-1">Palabras nuevas en negrita:</p>
                {renderDiff(exp.descripcion, expSugeridas[i])}
              </div>

              <textarea
                value={expSugeridas[i]}
                onChange={e => setExpSugeridas(prev => ({ ...prev, [i]: e.target.value }))}
                rows={Math.max(3, (expSugeridas[i] || '').split('\n').length + 1)}
                style={{ whiteSpace: 'pre-wrap' }}
                className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none leading-relaxed"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => aplicarSugerenciaExp(i)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckFat size={14} weight="fill" /> Aplicar
                </button>
                <button
                  onClick={() => rechazarSugerenciaExp(i)}
                  className="px-5 bg-white border border-slate-200 text-slate-500 text-xs font-bold py-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Ignorar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      <button onClick={addExp} className="w-full border-2 border-dashed border-blue-300 text-blue-600 font-bold py-2.5 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 text-sm cursor-pointer">
        <Plus size={16} /> Agregar experiencia
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
