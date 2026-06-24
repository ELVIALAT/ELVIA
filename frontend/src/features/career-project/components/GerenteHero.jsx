// features/career-project/components/GerenteHero.jsx
// Hero header del Gerente de Búsqueda (barra compacta + hero completo). Extraído verbatim del orquestador.
import { CheckCircle, Sparkle, SpinnerGap, Target } from '@phosphor-icons/react'

export default function GerenteHero({ generandoPdf, handleClickGenerarInfografia, mostrarHeroCompleto, pct, porPilar, saved, saving, setHeroVisible }) {
  return (
    <>
      {!mostrarHeroCompleto && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 py-4 px-6 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center gap-4">
            {/* Icono + título */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center">
                <Target size={16} weight="fill" className="text-violet-300"/>
              </div>
              <span className="text-sm font-black text-white tracking-tight hidden sm:block">Autoconocimiento</span>
            </div>

            {/* Barra de progreso — centrada y más grande */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 w-full max-w-xs">
                <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 80
                        ? 'linear-gradient(90deg,#10b981,#34d399)'
                        : pct >= 40
                        ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                        : 'linear-gradient(90deg,#8b5cf6,#a78bfa)'
                    }}
                  />
                </div>
                <span className="text-sm font-black text-white tabular-nums">{pct}%</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">tu progreso actual</span>
            </div>

            {/* Botón "Ver avance" centrado con animación */}
            <button
              onClick={() => setHeroVisible(true)}
              className="shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all hover:scale-105 shadow-lg shadow-violet-900/50"
              style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
            >
              <span>Ver avance</span>
              <span className="inline-block" style={{ animation: 'bounce-y 1s ease-in-out infinite' }}>↓</span>
            </button>
          </div>

          {/* Keyframes inline para la animación */}
          <style>{`
            @keyframes pulse-glow {
              0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4), 0 4px 24px rgba(139,92,246,0.3); }
              50%       { box-shadow: 0 0 0 6px rgba(139,92,246,0), 0 4px 24px rgba(139,92,246,0.6); }
            }
            @keyframes bounce-y {
              0%, 100% { transform: translateY(0); }
              50%       { transform: translateY(3px); }
            }
          `}</style>
        </div>
      )}
      {mostrarHeroCompleto && <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

            {/* Left: text */}
            <div className="flex-1">
              {/* Eyebrow */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-200/50 shadow-sm">
                  <Target size={16} weight="fill" className="text-violet-600"/>
                </div>
                <span className="text-[11px] font-black text-violet-600 uppercase tracking-[0.15em]">Marco PMI · Planificación Estratégica</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6">
                Sé Gerente de Proyecto<br/>
                <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">de tu Búsqueda Laboral</span>
              </h1>

              <p className="text-slate-500 text-lg leading-relaxed max-w-xl mb-6 font-medium">
                Tómate este tiempo para reflexionar. Deja de lado urgencias y concéntrate en
                entender <span className="font-bold text-slate-800 underline decoration-violet-300 decoration-2 underline-offset-4">muy bien tu propio perfil</span>.
                Es el mejor momento para evaluar, reevaluar y avanzar con una estrategia de última generación.
              </p>

              {/* Stat inline - Premium Glass */}
              <div className="inline-flex items-center gap-3 bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-2xl px-5 py-3.5 group transition-all hover:scale-[1.02]">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-violet-200">73%</div>
                <span className="text-[13px] font-bold text-slate-600 leading-tight max-w-[220px]">de quienes lo completan <span className="text-violet-600">ganan claridad inmediata</span> sobre su oferta de valor</span>
              </div>

              {/* Save indicator */}
              <div className="mt-6 h-6">
                {saving&&<span className="flex items-center gap-1.5 text-xs text-slate-400 font-bold tracking-wide uppercase"><SpinnerGap size={14} className="animate-spin text-violet-500"/> Sincronizando en la nube...</span>}
                {saved &&<span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit border border-emerald-100 shadow-sm animate-fade-in"><CheckCircle size={14} weight="fill"/> Guardado Seguro</span>}
              </div>
            </div>

            {/* Right: progress card — World Class Design */}
            <div className="md:w-[340px] shrink-0">
              <div className="relative group overflow-hidden bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/40 border border-slate-800">
                {/* Mesh Gradient Background Effect */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-violet-600/30 blur-[100px] rounded-full group-hover:bg-violet-600/40 transition-colors duration-1000"/>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full group-hover:bg-indigo-600/30 transition-colors duration-1000"/>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Estatus General</p>
                    <div className="bg-slate-800/50 backdrop-blur-md rounded-lg px-2 py-1 border border-white/5">
                      <span className="text-[10px] font-bold text-slate-300">FASE 1</span>
                    </div>
                  </div>

                  {/* Circle - Larger and more Premium */}
                  <div className="relative w-36 h-36 mx-auto mb-8 transform group-hover:scale-105 transition-transform duration-700">
                    <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" viewBox="0 0 112 112">
                      <circle cx="56" cy="56" r="48" strokeWidth="10" stroke="#101827" fill="none"/>
                      <circle cx="56" cy="56" r="48" strokeWidth="10"
                        stroke={pct>=80?'#10b981':pct>=50?'#f59e0b':'#8b5cf6'}
                        strokeLinecap="round" fill="none"
                        strokeDasharray={`${2*Math.PI*48}`}
                        strokeDashoffset={`${2*Math.PI*48*(1-pct/100)}`}
                        style={{transition:'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)'}}/>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-5xl font-black text-white tracking-tighter">{pct}</span>
                        <span className="text-lg font-black text-white/40">%</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Óptimo</span>
                    </div>
                  </div>

                  {/* High Contrast Legend */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-8 bg-white/5 rounded-2xl p-4 border border-white/5">
                    {[
                      {label:'Perfil',            id:'perfil',           color:'bg-indigo-500'},
                      {label:'Competencias',      id:'autoconocimiento', color:'bg-violet-500'},
                      {label:'Gastos',            id:'recursos',         color:'bg-blue-400'},
                      {label:'Semana',            id:'semana',           color:'bg-teal-400'},
                      {label:'Oferta de Valor',   id:'oferta',           color:'bg-rose-500'},
                      {label:'CV Optimizer',      id:'documentos',       color:'bg-amber-400'},
                    ].map(function(l){
                      const v = porPilar[l.id] || 0
                      return(
                      <div key={l.label} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{l.label}</span>
                          <span className={`text-[11px] font-black ${v>=80?'text-emerald-400':v>=40?'text-amber-400':'text-slate-400'}`}>{v}%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full">
                          <div className={`h-full ${l.color} transition-all duration-1000`} style={{width: v+'%'}}/>
                        </div>
                      </div>
                    )})}
                  </div>

                  {/* Generar PDF Infográfico CTA — Glow Effect */}
                  <button
                    onClick={handleClickGenerarInfografia}
                    disabled={generandoPdf}
                    className="group/btn w-full relative overflow-hidden bg-white text-slate-900 font-black text-xs py-4 rounded-[1.25rem] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] disabled:opacity-50"
                    title={(pct < 50 && porPilar?.oferta !== 100) ? "Requiere 50% de completitud o 100% de Oferta de Valor" : "Genera tu presentación ejecutiva"}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"/>
                    <div className="relative z-10 flex items-center justify-center gap-2 group-hover/btn:text-white transition-colors">
                      {generandoPdf ? <SpinnerGap size={18} className="animate-spin" /> : <Sparkle size={18} weight="fill" className="text-violet-600 group-hover/btn:text-white transition-colors" />}
                      <span className="tracking-widest uppercase">{generandoPdf ? 'Procesando...' : 'Infografía Ejecutiva'}</span>
                    </div>
                  </button>
                  <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest mt-4">
                    Impulsado por Tecnología de Última Generación ELVIA®
                  </p>
                </div>
              </div>
            </div>
          </div>
          {pct > 0 && (
            <div className="max-w-5xl mx-auto px-6 md:px-10 pb-5 flex justify-end">
              <button
                onClick={() => setHeroVisible(false)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black px-4 py-2 rounded-lg transition-all hover:scale-105 shadow-md"
              >
                Ocultar avance ↑
              </button>
            </div>
          )}
        </div>
      </div>}
    </>
  )
}
