// features/interview/components/PasoSetup.jsx
// PASO 1 — Configuración de la simulación (vacante guardada o datos manuales).
// Extraído verbatim desde pages/Entrevista.jsx (Fase 3).
import { Spinner, Lightning } from '@phosphor-icons/react'
import HelpBadge from '../../../components/common/HelpBadge'
import { ENTREVISTADORES, NUM_PREGUNTAS, TIPO_FEEDBACK } from '../constants'
import { useEntrevistaCtx } from '../EntrevistaContext'

export default function PasoSetup() {
  const {
    vacantesGuardadas, seleccionarVacante, vacanteSel, setVacanteSel,
    setEmpresa, setCargo, setDescripcion, empresa, cargo, entrevistador,
    setEntrevistador, descripcion, numPreguntas, setNumPreguntas,
    tipoFeedback, setTipoFeedback, error, iniciarEntrevista, loadingPreguntas,
  } = useEntrevistaCtx()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
          Configurar Simulación
          <HelpBadge id="entrevista.setup" />
        </h2>
      </div>


      {/* Vacantes guardadas */}
      {vacantesGuardadas.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Practicar con una vacante guardada</h2>
          <p className="text-xs text-gray-400 mb-3">Solo se muestran vacantes con compatibilidad ≥ 75%</p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {vacantesGuardadas.map(v => (
              <button key={v.id} onClick={() => seleccionarVacante(v)}
                className={`w-full text-left p-3 rounded-xl border text-sm transition-colors
                  ${vacanteSel?.id === v.id
                    ? 'bg-primary/5 border-primary/40 text-primary font-medium'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{v.job_data?.title}</p>
                  <span className="shrink-0 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">{v.score}%</span>
                </div>
                {v.job_data?.company && <p className="text-xs text-gray-400 mt-0.5">{v.job_data.company}</p>}
              </button>
            ))}
          </div>
          {vacanteSel && (
            <button onClick={() => { setVacanteSel(null); setEmpresa(''); setCargo(''); setDescripcion('') }}
              className="text-xs text-gray-400 hover:text-red-500 mt-2 transition-colors">
              × Limpiar selección
            </button>
          )}
        </div>
      )}

      {/* Formulario */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">
          {vacanteSel ? 'Datos de la vacante (editables)' : 'Datos de la entrevista'}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Empresa</label>
            <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)}
              placeholder="Ej. Google, FEMSA..."
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Cargo *</label>
            <input type="text" value={cargo} onChange={e => setCargo(e.target.value)}
              placeholder="Ej. Gerente de Operaciones"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        {/* Tipo de entrevistador */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">¿Con quién te entrevistas?</label>
          <div className="grid grid-cols-3 gap-2">
            {ENTREVISTADORES.map(e => (
              <button key={e.value} onClick={() => setEntrevistador(e.value)}
                className={`p-3 rounded-xl border text-left transition-colors
                  ${entrevistador === e.value
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-200 text-gray-700 hover:border-primary/50'}`}>
                <p className={`text-xs font-bold ${entrevistador === e.value ? 'text-white' : 'text-gray-800'}`}>{e.label}</p>
                <p className={`text-[10px] mt-0.5 ${entrevistador === e.value ? 'text-white/80' : 'text-gray-400'}`}>{e.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Descripción o link de la vacante <span className="text-gray-400">(opcional pero recomendado)</span></label>
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3}
            placeholder="Pega aquí la descripción de la vacante o el link..."
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>

        {/* Número de preguntas */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Número de preguntas</label>
          <div className="flex gap-2">
            {NUM_PREGUNTAS.map(n => (
              <button key={n} onClick={() => setNumPreguntas(n)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors
                  ${numPreguntas === n ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'}`}>
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">50% técnicas · 50% soft skills</p>
        </div>

        {/* Tipo de feedback */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">¿Cuándo quieres el feedback?</label>
          <div className="grid grid-cols-2 gap-2">
            {TIPO_FEEDBACK.map(t => (
              <button key={t.value} onClick={() => setTipoFeedback(t.value)}
                className={`p-3 rounded-xl border text-left transition-colors
                  ${tipoFeedback === t.value ? 'bg-primary/5 border-primary text-primary' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                <p className="text-xs font-bold">{t.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
        )}

        <button onClick={iniciarEntrevista} disabled={loadingPreguntas || !cargo.trim()}
          className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loadingPreguntas
            ? <><Spinner size={18} className="animate-spin" /> Generando preguntas...</>
            : <><Lightning size={18} weight="fill" /> Comenzar entrevista</>}
        </button>
      </div>
    </div>
  )
}
