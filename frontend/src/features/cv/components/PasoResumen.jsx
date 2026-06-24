// features/cv/components/PasoResumen.jsx
// PASO 1 del wizard — Resumen profesional (borrador + fusión CV/Oferta + optimización IA).
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import HelpBadge from '../../../components/common/HelpBadge'
import { Notepad, Sparkle, MagicWand, SpinnerGap, X, Warning, CheckFat, Lock, PencilSimple } from '@phosphor-icons/react'
import Tooltip from './Tooltip'
import { renderDiff, renderDiffFusion } from '../diff'

export default function PasoResumen({
  modoForzado, cvResumenOriginal, ofertaValorGerente, handleFusionarResumen,
  fusionando, errorFusion, resumenFusionSugerido, setResumenFusionSugerido,
  resumenBloqueado, setResumenBloqueado, upDatos, datos,
  handleOptimizarResumen, optimizandoResumen, resumenSugerido, setResumenSugerido,
  tips,
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
        <h2 className="text-base font-bold text-slate-800">Resumen Profesional</h2>
        <HelpBadge id="cvdesdecero.resumen" />
      </div>

      {/* ── Path A: Fusión CV original + Oferta de Valor ─────────────────── */}
      {modoForzado === 'upload' && (cvResumenOriginal || ofertaValorGerente) && (
        <div className="space-y-4">
          {/* Caja A: Resumen del CV original (read-only) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Notepad size={14} weight="duotone" /> A. Resumen extraído de tu CV
            </label>
            {cvResumenOriginal ? (
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{cvResumenOriginal}</p>
            ) : (
              <p className="text-xs text-slate-400 italic">Tu CV no traía un resumen explícito.</p>
            )}
          </div>

          {/* Caja B: Oferta de Valor del Gerente (read-only) */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <label className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <Sparkle size={14} weight="duotone" /> B. Tu Oferta de Valor (Gerente de Proyecto)
            </label>
            {ofertaValorGerente ? (
              <p className="text-xs text-indigo-900/80 leading-relaxed whitespace-pre-line">{ofertaValorGerente}</p>
            ) : (
              <p className="text-xs text-indigo-400 italic">Aún no has llenado Mi Oferta de Valor en el Gerente de Proyecto.</p>
            )}
          </div>

          {/* Botón fusión */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleFusionarResumen}
              disabled={fusionando || (!cvResumenOriginal && !ofertaValorGerente)}
              className={`flex items-center gap-2 text-sm font-black px-6 py-3 rounded-xl transition-all shadow-lg ${fusionando ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 hover:shadow-xl cursor-pointer'}`}
            >
              {fusionando ? <SpinnerGap size={18} className="animate-spin" /> : <MagicWand size={18} weight="fill" />}
              {fusionando ? 'Fusionando con ELVIA®…' : 'Fusionar con ELVIA®'}
            </button>
            <p className="text-[10px] text-slate-400 text-center max-w-xs">
              ELVIA® sintetiza ambos textos en un resumen ATS-optimizado. Cero alucinación: solo usa información presente en tus textos.
            </p>
            {errorFusion && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mt-1">{errorFusion}</div>
            )}
          </div>

          {/* Separador visual */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">C. Resultado</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
        </div>
      )}

      {/* Propuesta de Fusión con ELVIA® (Editable + Diff) */}
      {resumenFusionSugerido && !resumenBloqueado && (
        <div className="p-6 bg-violet-50/30 border-2 border-dashed border-violet-300 rounded-3xl animate-in fade-in slide-in-from-top-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-200/50 shadow-sm">
                <Sparkle size={16} weight="fill" className="text-violet-600" />
              </div>
              <div>
                <span className="text-[10px] font-black text-violet-700 uppercase tracking-widest">Fusión Estratégica ELVIA®</span>
                <h4 className="text-xs font-bold text-slate-800 leading-none mt-0.5">Propuesta de Fusión (Editable)</h4>
              </div>
            </div>
            <button onClick={() => setResumenFusionSugerido('')} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
          </div>

          {/* Diff visual */}
          <div className="p-4 bg-white/80 rounded-2xl text-xs leading-relaxed text-slate-600 border border-violet-100 shadow-inner">
            <p className="font-bold text-[9px] text-violet-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkle size={12} weight="fill" /> Palabras estratégicas nuevas añadidas por ELVIA® (en verde):
            </p>
            <div className="max-h-[220px] overflow-y-auto pr-1">
              {renderDiffFusion(cvResumenOriginal, resumenFusionSugerido)}
            </div>
          </div>

          {/* Textarea editable de la propuesta */}
          <textarea
            value={resumenFusionSugerido}
            onChange={e => setResumenFusionSugerido(e.target.value)}
            rows={8}
            maxLength={1000}
            className="w-full bg-white border border-violet-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 resize-y shadow-sm leading-relaxed"
            style={{ minHeight: 150 }}
          />

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={() => { upDatos('resumen', resumenFusionSugerido); setResumenFusionSugerido(''); setResumenBloqueado(true) }}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 cursor-pointer"
            >
              <CheckFat size={16} weight="fill" /> Aplicar Fusión y Finalizar
            </button>
            <button
              onClick={() => setResumenFusionSugerido('')}
              className="px-6 bg-white border border-slate-200 text-slate-500 text-xs font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* CAJA principal: borrador/entrada */}
      <div className={`transition-all duration-300 ${(resumenBloqueado || resumenFusionSugerido) ? 'opacity-50 pointer-events-none scale-[0.98]' : ''}`}>
        <label className="text-sm font-bold text-slate-700 flex items-center justify-between mb-2">
          <span className="flex items-center gap-1">
            {modoForzado === 'upload' ? 'Resumen profesional definitivo' : '1. Tu borrador profesional'}
            <Tooltip text="Escribe libremente tus logros y trayectoria. La IA te ayudará a pulirlo." />
          </span>
          {resumenBloqueado && <button onClick={()=>setResumenBloqueado(false)} className="text-xs text-indigo-600 font-bold hover:underline">Editar de nuevo</button>}
        </label>
        {modoForzado === 'scratch' && datos.resumen && (
          <p className="text-xs text-slate-500 leading-relaxed mb-2 px-1">
            Esta es la sugerencia que resulta de tu <span className="font-bold text-indigo-600">Autoconocimiento</span>. Puedes modificarla y/o mejorarla con la ayuda de ELVIA®.
          </p>
        )}
        {modoForzado === 'upload' && (
          <p className="text-xs text-slate-500 leading-relaxed mb-2 px-1">
            Edita libremente o usa <span className="font-bold text-indigo-600">Fusionar con ELVIA®</span> arriba para combinar tu CV con tu Oferta de Valor.
          </p>
        )}
        <textarea
          placeholder="Describe tu trayectoria..."
          value={datos.resumen}
          onChange={e => upDatos('resumen', e.target.value)}
          rows={12}
          maxLength={1000}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-y bg-white shadow-sm leading-relaxed"
          style={{ minHeight: 220 }}
        />
        {datos.resumen.length > 800 && (
          <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <Warning size={14} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Tu resumen tiene <span className="font-bold">{datos.resumen.length} caracteres</span>. Para un CV de 1 página, lo ideal es mantenerlo entre 400 y 800. Considera acortarlo.
            </p>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={handleOptimizarResumen}
            disabled={optimizandoResumen || !datos.resumen || resumenBloqueado}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm ${optimizandoResumen ? 'bg-slate-100 text-slate-400' : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100'}`}
          >
            {optimizandoResumen ? <SpinnerGap size={16} className="animate-spin" /> : <MagicWand size={16} weight="bold" />}
            {optimizandoResumen ? 'Analizando...' : 'Sugerencia de mejora'}
          </button>
          <div className={`text-[10px] ${datos.resumen.length >= 900 ? 'text-rose-500 font-bold' : datos.resumen.length >= 800 ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>{datos.resumen.length}/1000 caracteres</div>
        </div>
      </div>

      {/* CAJA 2: Sugerencia Editable con Diff */}
      {resumenSugerido && !resumenBloqueado && (
        <div className="p-5 bg-indigo-50/40 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-top-4 shadow-sm border-dashed border-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MagicWand size={18} weight="fill" className="text-indigo-600" />
              <span className="text-xs font-black text-indigo-900 uppercase tracking-widest">Sugerencia de mejora (Editable)</span>
            </div>
            <button onClick={() => setResumenSugerido('')} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
          </div>

          {/* Visualización de Cambios (Diff) */}
          <div className="mb-4 p-3 bg-white/60 rounded-lg text-xs leading-relaxed text-slate-600 border border-indigo-50">
            <p className="font-bold text-[10px] text-indigo-400 uppercase mb-1">Cambios detectados:</p>
            {renderDiff(datos.resumen, resumenSugerido)}
          </div>

          <textarea
            value={resumenSugerido}
            onChange={e => setResumenSugerido(e.target.value)}
            rows={4}
            className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/30 resize-none shadow-inner mb-4"
          />

          <div className="flex gap-3">
            <button
              onClick={() => { upDatos('resumen', resumenSugerido); setResumenSugerido(''); setResumenBloqueado(true) }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
            >
              <CheckFat size={16} weight="fill" /> Aplicar y Finalizar
            </button>
            <button
              onClick={() => setResumenSugerido('')}
              className="px-6 bg-white border border-slate-200 text-slate-500 text-xs font-bold py-3 rounded-xl hover:bg-slate-50 transition-all"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}

      {/* CAJA 3: Resultado Final (Solo Lectura) */}
      {resumenBloqueado && (
        <div className="p-6 bg-emerald-50/50 border border-emerald-200 rounded-3xl animate-in zoom-in-95 duration-500 shadow-xl shadow-emerald-900/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Lock size={20} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sección Completada</p>
              <p className="text-sm font-bold text-slate-800 leading-tight">Tu resumen profesional final</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-inner relative group">
            <p className="text-sm text-slate-700 leading-relaxed italic">
              "{datos.resumen}"
            </p>
            <button
              onClick={() => setResumenBloqueado(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
              title="Editar de nuevo"
            >
              <PencilSimple size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {tips.length > 0 && !resumenBloqueado && !resumenSugerido && (
        <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1.5">
            <Notepad size={16} className="text-amber-500" />
            💡 Tips para mejorar esta sección:
          </p>
          <ul className="space-y-1.5">{tips.map((t,i)=><li key={i} className="text-xs text-amber-700 flex gap-2 leading-relaxed"><span className="shrink-0 text-amber-400">●</span><span>{t}</span></li>)}</ul>
        </div>
      )}
    </div>
  )
}
