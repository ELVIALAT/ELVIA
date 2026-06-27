// features/interview/components/PasoFeedback.jsx
// PASO 3 — Evaluación y feedback final (score, secciones, recomendaciones, detalle).
// Extraído verbatim desde pages/Entrevista.jsx (Fase 3).
import { Trophy, CheckCircle, Target, Star, ArrowLeft } from '@phosphor-icons/react'
import HelpBadge from '../../../components/common/HelpBadge'
import ScoreRing from './ScoreRing'
import Estrellas from './Estrellas'
import { useEntrevistaCtx } from '../EntrevistaContext'

export default function PasoFeedback() {
  const { evaluacion, cargo, empresa, guardadoEnPipeline, preguntas, reiniciar, navigate } = useEntrevistaCtx()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          Evaluación y Feedback
          <HelpBadge id="entrevista.feedback" />
        </h2>
      </div>

      {/* Score */}
      <div className="card flex flex-col sm:flex-row items-center gap-6">
        <ScoreRing score={evaluacion.puntuacion} />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
            <Trophy size={20} weight="duotone" className="text-amber-500" />
            <p className="text-lg font-bold text-gray-900">Resultado de tu entrevista</p>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{evaluacion.resumen}</p>
          <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start flex-wrap">
            <p className="text-xs text-gray-500">Cargo: <strong className="text-gray-700">{cargo}</strong></p>
            {empresa && <><span className="text-gray-300">·</span><p className="text-xs text-gray-500">{empresa}</p></>}
            {guardadoEnPipeline && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                ✓ Reporte guardado · disponible 14 días en Mis Documentos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Evaluación por secciones (nueva estructura) */}
      {evaluacion.secciones && evaluacion.secciones.length > 0 ? (
        <div className="space-y-4">
          {evaluacion.secciones.map((sec, idx) => (
            <div key={idx} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{sec.titulo}</h3>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  sec.puntuacion >= 8 ? 'bg-green-100 text-green-700' :
                  sec.puntuacion >= 6 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-600'
                }`}>
                  {sec.puntuacion}/10
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">{sec.feedback}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1">
                    <CheckCircle size={14} weight="fill" /> Fortalezas
                  </p>
                  <ul className="space-y-1.5">
                    {sec.fortalezas?.map((f, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-2">
                        <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
                    <Target size={14} weight="fill" /> Áreas de mejora
                  </p>
                  <ul className="space-y-1.5">
                    {sec.areas_mejora?.map((m, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-2">
                        <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Fallback a estructura antigua si no hay secciones */
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle size={16} weight="fill" className="text-green-500" /> Fortalezas
            </h3>
            <ul className="space-y-2">
              {evaluacion.fortalezas?.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-green-500 shrink-0 mt-0.5">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Target size={16} weight="fill" className="text-amber-500" /> Áreas de mejora
            </h3>
            <ul className="space-y-2">
              {evaluacion.areas_mejora?.map((a, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-600">
                  <span className="text-amber-500 shrink-0 mt-0.5">→</span>{a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      <div className="card">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Star size={16} weight="duotone" className="text-primary" /> Recomendaciones para mejorar
        </h3>
        <ul className="space-y-2">
          {evaluacion.recomendaciones?.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600 py-2 border-b border-gray-50 last:border-0">
              <span className="shrink-0 font-bold text-primary text-xs mt-0.5">{i + 1}.</span>{r}
            </li>
          ))}
        </ul>
      </div>

      {/* Detalle por pregunta */}
      {evaluacion.detalle?.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Detalle por pregunta</h3>
          <div className="space-y-4">
            {evaluacion.detalle.map((d, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-xs font-semibold text-gray-700 flex-1">{d.pregunta || preguntas[i]?.pregunta}</p>
                  <Estrellas n={d.calificacion || 3} />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{d.comentario}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={reiniciar}
          className="flex-1 border border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
          <ArrowLeft size={16} weight="bold" /> Nueva entrevista
        </button>
        <button onClick={() => navigate('/mis-cvs?tab=reportes')}
          className="flex-1 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-colors">
          Ver en Mis Documentos →
        </button>
      </div>
    </div>
  )
}
