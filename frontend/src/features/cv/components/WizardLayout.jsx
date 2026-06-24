// features/cv/components/WizardLayout.jsx
// Chrome presentacional del wizard: header, barra de pasos, % de llenado, banner de
// autosave, despacho de los 7 pasos, navegación y panel lateral de análisis.
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3). Sin lógica: solo presentación
// y plumbing de props — toda la lógica/persistencia vive en el orquestador.
import { ArrowLeft, ArrowRight, SpinnerGap, FileArrowDown, Eye, X } from '@phosphor-icons/react'
import { PASOS } from '../constants'
import PanelAnalisis from './PanelAnalisis'
import PasoDatos from './PasoDatos'
import PasoResumen from './PasoResumen'
import PasoExperiencia from './PasoExperiencia'
import PasoEducacion from './PasoEducacion'
import PasoHabilidades from './PasoHabilidades'
import PasoIdiomas from './PasoIdiomas'
import PasoPreview from './PasoPreview'

export default function WizardLayout({
  // chrome
  modoForzado, pasoActual, setPasoActual, pctLlenado, setShowCancelModal,
  user, ultimoGuardado, analisis, setAnalisis, error,
  generando, iniciarGenerarCV,
  // datos personales (paso 0)
  fileRef, extraerCV, cvFileName, extrayendo, cvMismatch, setCvMismatch,
  setCvPending, setCvFileName, cvIdioma, datos, upDatos, tipsPorPaso,
  // resumen (paso 1)
  cvResumenOriginal, ofertaValorGerente, handleFusionarResumen, fusionando,
  errorFusion, resumenFusionSugerido, setResumenFusionSugerido, resumenBloqueado,
  setResumenBloqueado, handleOptimizarResumen, optimizandoResumen, resumenSugerido,
  setResumenSugerido,
  // experiencia (paso 2)
  delExp, upExp, addExp, handleOptimizarExp, expOptimizando, expSugeridas,
  expMejoradas, aplicarSugerenciaExp, rechazarSugerenciaExp, setExpSugeridas,
  // educación (paso 3)
  delEdu, upEdu, addEdu,
  // habilidades (paso 4)
  togHab, nuevaHab, setNuevaHab, addHab,
  // idiomas (paso 5)
  setDatos, upNivIdm, togIdm,
  // preview (paso 6)
  borradorFinal, setBorradorFinal,
}) {
  const pasoInfo = PASOS[pasoActual]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className={`mx-auto transition-all duration-300 ${analisis ? 'max-w-5xl' : 'max-w-2xl'}`}>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-slate-800 mb-1">
                {modoForzado === 'upload' ? 'Optimiza tu CV' : 'Crea tu CV desde cero'}
              </h1>
              <p className="text-slate-500 text-sm">Paso {pasoActual + 1} de {PASOS.length} · {pasoInfo.icon} {pasoInfo.label}</p>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer">
              <X size={14} weight="bold" /> Cancelar
            </button>
          </div>

          {/* Barra de pasos */}
          <div className="mt-3 flex gap-1">
            {PASOS.map((p, i) => (
              <div key={p.id} className={`flex-1 h-1.5 rounded-full transition-all ${i < pasoActual ? 'bg-green-500' : i === pasoActual ? 'bg-blue-500' : 'bg-slate-200'}`} />
            ))}
          </div>

          {/* % de llenado */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 bg-slate-200 rounded-full h-1">
              <div className={`h-1 rounded-full transition-all duration-500 ${pctLlenado >= 80 ? 'bg-green-500' : pctLlenado >= 50 ? 'bg-amber-400' : 'bg-blue-400'}`}
                style={{ width: `${pctLlenado}%` }} />
            </div>
            <span className={`text-xs font-bold shrink-0 ${pctLlenado >= 80 ? 'text-green-600' : pctLlenado >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>
              {pctLlenado}% completado
            </span>
          </div>
        </div>

        {/* Banners de estado */}
        {user && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {ultimoGuardado
              ? `✓ Guardado a las ${ultimoGuardado.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
              : 'Tus cambios se guardarán automáticamente...'}
          </div>
        )}


        {/* Layout: 1 col normal, 2 col cuando hay panel de análisis */}
        <div className={analisis ? 'grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start' : ''}>

          {/* ── Wizard principal ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7">

            {pasoActual === 0 && (
              <PasoDatos
                modoForzado={modoForzado}
                fileRef={fileRef}
                extraerCV={extraerCV}
                cvFileName={cvFileName}
                extrayendo={extrayendo}
                cvMismatch={cvMismatch}
                setCvMismatch={setCvMismatch}
                setCvPending={setCvPending}
                setCvFileName={setCvFileName}
                analisis={analisis}
                cvIdioma={cvIdioma}
                error={error}
                datos={datos}
                upDatos={upDatos}
                tips={tipsPorPaso.datos}
              />
            )}

            {pasoActual === 1 && (
              <PasoResumen
                modoForzado={modoForzado}
                cvResumenOriginal={cvResumenOriginal}
                ofertaValorGerente={ofertaValorGerente}
                handleFusionarResumen={handleFusionarResumen}
                fusionando={fusionando}
                errorFusion={errorFusion}
                resumenFusionSugerido={resumenFusionSugerido}
                setResumenFusionSugerido={setResumenFusionSugerido}
                resumenBloqueado={resumenBloqueado}
                setResumenBloqueado={setResumenBloqueado}
                upDatos={upDatos}
                datos={datos}
                handleOptimizarResumen={handleOptimizarResumen}
                optimizandoResumen={optimizandoResumen}
                resumenSugerido={resumenSugerido}
                setResumenSugerido={setResumenSugerido}
                tips={tipsPorPaso.resumen}
              />
            )}

            {pasoActual === 2 && (
              <PasoExperiencia
                datos={datos}
                delExp={delExp}
                upExp={upExp}
                addExp={addExp}
                handleOptimizarExp={handleOptimizarExp}
                expOptimizando={expOptimizando}
                expSugeridas={expSugeridas}
                expMejoradas={expMejoradas}
                aplicarSugerenciaExp={aplicarSugerenciaExp}
                rechazarSugerenciaExp={rechazarSugerenciaExp}
                setExpSugeridas={setExpSugeridas}
                tips={tipsPorPaso.experiencia}
              />
            )}

            {pasoActual === 3 && (
              <PasoEducacion
                datos={datos}
                delEdu={delEdu}
                upEdu={upEdu}
                addEdu={addEdu}
                tips={tipsPorPaso.educacion}
              />
            )}

            {pasoActual === 4 && (
              <PasoHabilidades
                datos={datos}
                togHab={togHab}
                nuevaHab={nuevaHab}
                setNuevaHab={setNuevaHab}
                addHab={addHab}
                tips={tipsPorPaso.habilidades}
              />
            )}

            {pasoActual === 5 && (
              <PasoIdiomas
                datos={datos}
                setDatos={setDatos}
                upNivIdm={upNivIdm}
                togIdm={togIdm}
                tips={tipsPorPaso.idiomas}
              />
            )}

            {pasoActual === 6 && (
              <PasoPreview
                datos={datos}
                borradorFinal={borradorFinal}
                setBorradorFinal={setBorradorFinal}
              />
            )}

            {/* Navegación */}
            <div className="mt-8 flex justify-between">
              <button onClick={() => setPasoActual(p => Math.max(0, p - 1))} disabled={pasoActual === 0}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-slate-300 rounded-xl font-bold text-slate-700 disabled:opacity-30 hover:border-slate-500 transition-colors text-sm cursor-pointer">
                <ArrowLeft size={16} /> {pasoActual === 6 ? 'Volver a editar' : 'Anterior'}
              </button>
              {pasoActual === PASOS.length - 1 ? (
                <button onClick={iniciarGenerarCV} disabled={generando || !(borradorFinal || datos).nombre || !(borradorFinal || datos).apellido}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold disabled:opacity-50 transition-colors text-sm cursor-pointer">
                  {generando ? <><SpinnerGap size={16} className="animate-spin" /> Generando...</> : <><FileArrowDown size={16} /> Generar CV</>}
                </button>
              ) : pasoActual === PASOS.length - 2 ? (
                <button onClick={() => setPasoActual(PASOS.length - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors text-sm cursor-pointer">
                  <Eye size={16} /> Ver Vista Previa
                </button>
              ) : (
                <button onClick={() => setPasoActual(p => Math.min(PASOS.length - 1, p + 1))}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors text-sm cursor-pointer">
                  Siguiente <ArrowRight size={16} />
                </button>
              )}
            </div>

            {error && pasoActual !== 0 && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
            )}
          </div>

          {/* ── Panel lateral de análisis ──────────────────────────────────── */}
          {analisis && (
            <div className="lg:sticky lg:top-6">
              <PanelAnalisis analisis={analisis} onClose={() => setAnalisis(null)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
