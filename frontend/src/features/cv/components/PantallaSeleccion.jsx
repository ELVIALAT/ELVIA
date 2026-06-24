// features/cv/components/PantallaSeleccion.jsx
// Pantalla de selección de ruta (subir CV vs empezar de cero / modo upload forzado).
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import { ArrowLeft, FileDoc, UploadSimple, SpinnerGap, PencilSimple } from '@phosphor-icons/react'
import { useCVWizard } from '../CVWizardContext'

export default function PantallaSeleccion() {
  const { modoForzado, fileRef, extraerCV, extrayendo, error, setModoSeleccion, navigate } = useCVWizard()
  const soloUpload = modoForzado === 'upload'
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      {/* Input oculto reutilizado del wizard */}
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx"
        onChange={e => extraerCV(e.target.files?.[0])} className="hidden" />

      <div className={soloUpload ? 'max-w-xl w-full' : 'max-w-2xl w-full'}>
        {/* Volver al pilar */}
        {soloUpload && (
          <button
            onClick={() => navigate('/proyecto-laboral')}
            className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer">
            <ArrowLeft size={14} weight="bold" /> Volver al Optimizador de CV
          </button>
        )}

        {/* Título */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 mb-5">
            <FileDoc size={30} weight="duotone" className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">
            {soloUpload ? 'Sube tu CV' : 'Crea tu CV Inicial'}
          </h1>
          <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
            {soloUpload
              ? 'ELVIA® analiza tu CV actual y lo combina con tu información del Gerente de Proyecto para entregarte una versión optimizada al estándar Harvard®.'
              : 'Tu CV base con el estándar Harvard® — el cimiento de tu transición con ELVIA®.'}
          </p>
        </div>

        {/* Cards */}
        <div className={soloUpload ? '' : 'grid sm:grid-cols-2 gap-5'}>

          {/* Card A: Subir mi CV (siempre visible) */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={extrayendo}
            className={`group relative bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-50 ${soloUpload ? 'p-10' : 'p-8'} text-left transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait w-full`}
          >
            {extrayendo && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex flex-col items-center justify-center gap-2 z-10">
                <SpinnerGap size={28} className="animate-spin text-indigo-500" />
                <p className="text-xs font-bold text-indigo-700">Analizando tu CV...</p>
              </div>
            )}
            <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-indigo-50 flex items-center justify-center mb-5 transition-colors">
              <UploadSimple size={24} weight="duotone" className="text-blue-600 group-hover:text-indigo-600 transition-colors" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-2">
              {soloUpload ? 'Selecciona tu CV (PDF o Word)' : 'Subir mi CV'}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {soloUpload
                ? 'Haz clic para escoger el archivo desde tu computadora. Lo procesamos y construimos un nuevo CV optimizado con tu contexto de ELVIA®.'
                : 'Tengo un CV listo. ELVIA lo analiza, lo estructura y lo optimiza al estándar Harvard.'}
            </p>
            <div className="mt-5 text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
              PDF o Word · Max. 5MB →
            </div>
          </button>

          {/* Card B: Empezar de cero (solo en modo legacy) */}
          {!soloUpload && (
            <button
              onClick={() => setModoSeleccion(false)}
              className="group bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-50 p-8 text-left transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center mb-5 transition-colors">
                <PencilSimple size={24} weight="duotone" className="text-emerald-600" />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-2">Empezar de cero</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Construye tu CV paso a paso con la guía de ELVIA, campo por campo y con IA en cada sección.
              </p>
              <div className="mt-5 text-xs font-bold text-slate-400 group-hover:text-emerald-600 transition-colors">
                6 pasos · ~15 minutos →
              </div>
            </button>
          )}

        </div>

        {error && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">{error}</div>
        )}

        {!soloUpload && (
          <p className="text-center text-[11px] text-slate-400 mt-8">
            En ambos casos terminarás con una Vista Previa Harvard antes de generar tu CV final.
          </p>
        )}
      </div>
    </div>
  )
}
