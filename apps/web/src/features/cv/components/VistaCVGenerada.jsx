// features/cv/components/VistaCVGenerada.jsx
// Vista del CV generado para revisión (score antes/después, cambios, descargas, confirmar).
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import { ArrowLeft, Check, DownloadSimple, FileDoc, SpinnerGap, CheckFat } from '@phosphor-icons/react'
import { descargarCV } from '../../../services/cvService'
import { analizarCalidad } from '../utils'
import { useCVWizard } from '../CVWizardContext'

export default function VistaCVGenerada() {
  const {
    cvGenerada, setCvGenerada, borradorFinal, datos, scoreAntes, analisis,
    generando, error, confirmarYGuardar,
  } = useCVWizard()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setCvGenerada(null)} className="mb-6 text-slate-600 hover:text-slate-800 font-semibold flex items-center gap-2">
          <ArrowLeft size={20} /> Volver a editar
        </button>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap font-mono text-xs leading-relaxed">
              {cvGenerada.optimizedCV}
            </div>
          </div>
          <div className="space-y-4">

            {/* ── Comparativa de score Antes → Después ── */}
            {(() => {
              const scoreFinal = analizarCalidad(borradorFinal || datos)
              const antes = scoreAntes || analisis
              if (!antes) return null
              const delta = scoreFinal.porcentaje - antes.porcentaje
              const colorAntes = antes.nivel === 'green' ? 'text-emerald-600' : antes.nivel === 'amber' ? 'text-amber-600' : 'text-red-500'
              const colorFinal = scoreFinal.nivel === 'green' ? 'text-emerald-600' : scoreFinal.nivel === 'amber' ? 'text-amber-600' : 'text-red-500'
              const ringFinal  = scoreFinal.nivel === 'green' ? 'border-emerald-400' : scoreFinal.nivel === 'amber' ? 'border-amber-400' : 'border-red-300'
              const ringAntes  = antes.nivel === 'green' ? 'border-emerald-300' : antes.nivel === 'amber' ? 'border-amber-300' : 'border-red-200'
              return (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <h3 className="font-black text-slate-800 text-sm mb-3">Impacto del CV optimizado</h3>
                  <div className="flex items-center justify-between gap-2">
                    {/* Score antes */}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${ringAntes}`}>
                        <span className={`text-xl font-black ${colorAntes}`}>{antes.porcentaje}%</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">Antes</span>
                    </div>
                    {/* Flecha + delta */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-slate-300 text-xl">→</span>
                      <span className={`text-xs font-black ${delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                        {delta > 0 ? `+${delta}` : delta === 0 ? '=' : delta} pts
                      </span>
                    </div>
                    {/* Score después */}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${ringFinal}`}>
                        <span className={`text-xl font-black ${colorFinal}`}>{scoreFinal.porcentaje}%</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">Después</span>
                    </div>
                  </div>
                  {/* Barra de progreso */}
                  <div className="mt-3 space-y-1">
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${scoreFinal.nivel === 'green' ? 'bg-emerald-500' : scoreFinal.nivel === 'amber' ? 'bg-amber-500' : 'bg-red-400'}`}
                        style={{ width: `${scoreFinal.porcentaje}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 text-right">{scoreFinal.estado}</p>
                  </div>
                </div>
              )
            })()}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
              {cvGenerada.changes?.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-2 text-sm">Cambios realizados</h3>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {cvGenerada.changes.slice(0, 4).map((c, i) => (
                      <li key={i} className="flex gap-2"><Check size={13} className="text-green-600 shrink-0 mt-0.5" /><span>{c}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {cvGenerada.recommendations?.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-2 text-sm">Recomendaciones</h3>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {cvGenerada.recommendations.slice(0, 3).map((r, i) => (<li key={i}>💡 {r}</li>))}
                  </ul>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => descargarCV(cvGenerada.id, 'pdf')}
                  disabled={!cvGenerada.id}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <DownloadSimple size={18} /> Descargar PDF
                </button>
                <button
                  onClick={() => descargarCV(cvGenerada.id, 'word')}
                  disabled={!cvGenerada.id}
                  className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <FileDoc size={18} className="text-blue-600" /> Descargar Word
                </button>
              </div>

              <div className="pt-2">
                <button onClick={confirmarYGuardar} disabled={generando}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-lg shadow-green-100">
                  {generando ? <><SpinnerGap size={18} className="animate-spin" /> Guardando...</> : <><CheckFat size={18} /> Confirmar y Finalizar</>}
                </button>
              </div>
              {error && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">{error}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
