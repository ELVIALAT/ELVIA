// features/linkedin/components/ResultadoView.jsx
// Vista de resultados del análisis (puntaje global, top acciones, secciones, informe PDF).
// Extraído verbatim desde pages/LinkedinPro.jsx (Fase 3); el early-return `if (resultado)`
// pasa a ser este componente (consumido cuando lp.resultado existe).
import { Trophy, Star, LightbulbFilament, CircleNotch, FileArrowDown, ArrowRight } from '@phosphor-icons/react'
import { SECCIONES } from '../constants'
import { colorPuntaje } from '../helpers'
import ScoreRing from './ScoreRing'
import SeccionResultado from './SeccionResultado'
import { useLinkedinCtx } from '../LinkedinContext'

export default function ResultadoView() {
  const {
    resultado, originalSnapshot, editables, setEditables, campos,
    informeGenerado, handleGenerarInforme, generandoInforme, navigate,
  } = useLinkedinCtx()

  const colorGlobal = colorPuntaje(resultado.puntaje_global)
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Puntaje global */}
      <div className={`rounded-2xl border ${colorGlobal.border} ${colorGlobal.bg} p-6 flex items-center gap-5`}>
        <ScoreRing score={resultado.puntaje_global} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Trophy size={18} weight="duotone" className={colorGlobal.text} />
            <h2 className="font-bold text-gray-900 text-lg">Puntaje de tu Perfil</h2>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${colorGlobal.labelBg} ${colorGlobal.labelText}`}>
              {colorGlobal.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{resultado.resumen_global}</p>
        </div>
      </div>

      {/* Prioridades rápidas */}
      {resultado.top_acciones?.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Star size={16} weight="duotone" className="text-amber-500" />
            Top acciones para mejorar tu perfil
          </p>
          <ol className="space-y-2">
            {resultado.top_acciones.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-[11px] shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {a}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Resultados por sección */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 px-1">Análisis por sección</h3>
        {SECCIONES.map(sec => {
          const datos = resultado.secciones?.[sec.id]
          const desdHistorial = !!resultado.campos_analizados
          if (!datos || (!desdHistorial && !campos[sec.id]?.trim())) return null
          return (
            <SeccionResultado
              key={sec.id}
              seccion={sec}
              datos={datos}
              original={originalSnapshot[sec.id] || ''}
              editable={editables[sec.id]}
              onEditableChange={(nuevo) => setEditables(prev => ({ ...prev, [sec.id]: nuevo }))}
            />
          )
        })}
      </div>

      {/* Acciones finales */}
      <div className="space-y-3">
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
          <p className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <LightbulbFilament size={16} weight="duotone" className="text-indigo-500" />
            Sobre estas sugerencias
          </p>
          <p className="text-sm text-indigo-700 leading-relaxed">
            Estas sugerencias se generaron tomando en cuenta tu Autoconocimiento, oferta de valor y el contexto de tu búsqueda laboral registrado en tu Gerente de Proyecto. Revísalas con calma y aplícalas gradualmente — el criterio final siempre es tuyo.
          </p>
        </div>

        {!informeGenerado ? (
          <button
            onClick={handleGenerarInforme}
            disabled={generandoInforme}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0077B5] to-[#019DF4] hover:brightness-110 text-white text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {generandoInforme ? (
              <><CircleNotch size={18} className="animate-spin" /> Generando informe...</>
            ) : (
              <><FileArrowDown size={18} weight="bold" /> Generar informe PDF</>
            )}
          </button>
        ) : (
          <div className="w-full py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            Informe generado
          </div>
        )}

        <button
          onClick={() => navigate('/mis-cvs?tab=reportes')}
          className="w-full py-3 rounded-2xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          Ir a Mis Documentos
          <ArrowRight size={14} weight="bold" />
        </button>

        <p className="text-center text-sm text-slate-500 font-medium leading-relaxed pt-2">
          Son sugerencias con las mejores prácticas de mercado, tu criterio es la palabra final.
        </p>
      </div>
    </div>
  )
}
