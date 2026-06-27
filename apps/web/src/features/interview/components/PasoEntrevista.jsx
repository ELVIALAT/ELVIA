// features/interview/components/PasoEntrevista.jsx
// PASO 2 — Sala de entrevista: avatar + pregunta (TTS), respuesta (STT/texto),
// feedback inmediato y navegación. La ayuda de permisos de micrófono se delega a
// BrowserPermisoHelp. Extraído verbatim desde pages/Entrevista.jsx (Fase 3).
import {
  SpeakerHigh, SpeakerSimpleSlash, Spinner, ArrowRight,
  Microphone, MicrophoneSlash, ChatText, CheckCircle,
} from '@phosphor-icons/react'
import HelpBadge from '../../../components/common/HelpBadge'
import Estrellas from './Estrellas'
import BrowserPermisoHelp from './BrowserPermisoHelp'
import { useEntrevistaCtx } from '../EntrevistaContext'

export default function PasoEntrevista() {
  const {
    preguntaActual, preguntaIdx, preguntas, progreso, hablando, leerEnVoz, muted,
    toggleMute, loadingFeedbackInm, feedbackInmediato, avanzarTraseFeedback,
    escuchando, toggleEscucha, esBrave, inputRespuesta, setInputRespuesta,
    respuestaCorta, setRespuestaCorta, MIN_CHARS, textareaRef, validarRespuesta,
    guardarRespuesta, finalizarEntrevista, setPreguntaIdx, siguientePregunta,
    tipoFeedback, loadingEval,
  } = useEntrevistaCtx()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          Sala de Entrevista
          <HelpBadge id="entrevista.entrevista" />
        </h2>
      </div>

      {/* Progreso */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Pregunta {preguntaIdx + 1} de {preguntas.length}</span>
          <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wide
            ${preguntaActual.tipo === 'tecnica' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
            {preguntaActual.tipo === 'tecnica' ? 'Técnica' : 'Soft Skill'}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progreso}%` }} />
        </div>
      </div>

      {/* Avatar OPTIMA + pregunta */}
      <div className="card">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0 relative">
            <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all bg-[#0A3D2A] ${hablando ? 'border-primary shadow-lg shadow-primary/20' : 'border-gray-200'}`}>
              <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="w-full h-full object-contain p-1.5" />
            </div>
            {hablando && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary items-center justify-center">
                  <SpeakerHigh size={9} weight="fill" className="text-white" />
                </span>
              </span>
            )}
          </div>
          {/* Pregunta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-bold text-primary">ELVIA</p>
              <button onClick={() => leerEnVoz(preguntaActual.pregunta)} title="Escuchar de nuevo"
                disabled={muted}
                className="text-gray-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <SpeakerHigh size={14} weight="duotone" />
              </button>
              <button onClick={toggleMute}
                title={muted ? 'Activar voz' : 'Silenciar voz'}
                aria-pressed={muted}
                className={`transition-colors ${muted ? 'text-primary' : 'text-gray-400 hover:text-primary'}`}>
                {muted
                  ? <SpeakerSimpleSlash size={14} weight="duotone" />
                  : <SpeakerHigh size={14} weight="regular" />}
              </button>
            </div>
            <p className="text-base font-semibold text-gray-800 leading-snug">{preguntaActual.pregunta}</p>
          </div>
        </div>
      </div>

      {/* Feedback inmediato (si aplica) */}
      {loadingFeedbackInm && (
        <div className="card flex items-center gap-3 py-4">
          <Spinner size={18} className="animate-spin text-primary shrink-0" />
          <p className="text-sm text-gray-500">Analizando tu respuesta...</p>
        </div>
      )}

      {feedbackInmediato && !loadingFeedbackInm && (
        <div className="card border-l-4 border-primary space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-800">Feedback de ELVIA</p>
            <Estrellas n={feedbackInmediato.calificacion || 3} />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{feedbackInmediato.comentario}</p>
          <button onClick={avanzarTraseFeedback}
            className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            {preguntaIdx + 1 >= preguntas.length ? 'Ver evaluación final' : 'Siguiente pregunta'}
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Respuesta del usuario */}
      {!feedbackInmediato && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">Tu respuesta</p>
            <div className="flex items-center gap-2">
              {escuchando && (
                <span className="text-xs text-red-500 font-medium flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span> Escuchando...
                </span>
              )}
              <button onClick={toggleEscucha}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                  ${escuchando
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-primary/10 hover:text-primary'}`}>
                {escuchando ? <MicrophoneSlash size={18} weight="fill" /> : <Microphone size={18} weight="duotone" />}
              </button>
            </div>
          </div>

          {esBrave && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
              ⚠ <strong>Brave bloquea el micrófono</strong> por política de privacidad. Para usar voz: desactiva Shields para este sitio o usa <strong>Chrome / Edge</strong>. También puedes escribir tu respuesta directamente.
            </p>
          )}

          <textarea ref={textareaRef} value={inputRespuesta}
            onChange={e => { setInputRespuesta(e.target.value); setRespuestaCorta(false) }} rows={5}
            placeholder="Habla o escribe tu respuesta aquí..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none bg-gray-50
              ${respuestaCorta ? 'border-amber-400 ring-1 ring-amber-300' : 'border-gray-200'}`} />

          {respuestaCorta && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5">⚠</span>
              Tu respuesta es muy corta. Intenta dar más detalle (al menos {MIN_CHARS} caracteres) para recibir feedback útil.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => {
              if (!validarRespuesta()) return
              const nuevas = guardarRespuesta()
              if (preguntaIdx + 1 >= preguntas.length) finalizarEntrevista(nuevas)
              else { setPreguntaIdx(i => i + 1); setInputRespuesta(nuevas[preguntaIdx + 1] || ''); setTimeout(() => leerEnVoz(preguntas[preguntaIdx + 1].pregunta), 300) }
            }} disabled={loadingFeedbackInm}
              className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {preguntaIdx + 1 >= preguntas.length ? <><CheckCircle size={16} weight="fill" /> Finalizar entrevista</> : <>Siguiente <ArrowRight size={15} weight="bold" /></>}
            </button>
            {tipoFeedback === 'pregunta' && inputRespuesta.trim() && (
              <button onClick={siguientePregunta} disabled={loadingFeedbackInm}
                className="border border-primary text-primary text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                <ChatText size={15} weight="duotone" /> Ver feedback
              </button>
            )}
          </div>

          <BrowserPermisoHelp />
        </div>
      )}

      {/* Terminar antes */}
      <button onClick={() => finalizarEntrevista()} disabled={loadingEval}
        className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-2">
        {loadingEval ? <span className="flex items-center justify-center gap-2"><Spinner size={14} className="animate-spin" /> Evaluando...</span> : 'Terminar y ver evaluación →'}
      </button>
    </div>
  )
}
