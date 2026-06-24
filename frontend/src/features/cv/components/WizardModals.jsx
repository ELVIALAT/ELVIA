// features/cv/components/WizardModals.jsx
// Modales de pie del wizard: placeholder sin reemplazar, confirmación de idioma y cancelar.
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import { Warning, UploadSimple } from '@phosphor-icons/react'

export default function WizardModals({
  alertaPlaceholder, setAlertaPlaceholder,
  alertaIdioma, setAlertaIdioma, cvIdioma, generarCV,
  showCancelModal, setShowCancelModal, modoForzado, user, navigate,
}) {
  return (
    <>
      {/* ── Modal: placeholder sin reemplazar ────────────────────────────── */}
      {alertaPlaceholder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Warning size={22} weight="duotone" className="text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Marcadores sin completar</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              El texto contiene marcadores sin completar (como{' '}
              <code className="bg-amber-50 text-amber-700 font-mono text-xs px-1.5 py-0.5 rounded">[X%]</code>
              {' '}o{' '}
              <code className="bg-amber-50 text-amber-700 font-mono text-xs px-1.5 py-0.5 rounded">[#]</code>
              ). Reemplázalos con valores reales o elimínalos antes de aplicar.
            </p>
            <button
              onClick={() => setAlertaPlaceholder(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ── Modal confirmación de idioma antes de generar ─────────────────── */}
      {alertaIdioma && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <Warning size={20} weight="duotone" className="text-amber-500" />
              </div>
              <h3 className="text-base font-bold text-slate-800">CV en otro idioma</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              Detectamos que tu CV está redactado en{' '}
              <strong>{cvIdioma === 'en' ? 'inglés' : cvIdioma === 'pt' ? 'portugués' : cvIdioma === 'fr' ? 'francés' : cvIdioma.toUpperCase()}</strong>.
              El CV generado saldrá en ese idioma. ¿Confirmas o prefieres generarlo en español?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => generarCV('es')}
                className="py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors cursor-pointer">
                Generar en español
              </button>
              <button
                onClick={() => generarCV(cvIdioma)}
                className="py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold transition-colors cursor-pointer">
                Continuar en {cvIdioma === 'en' ? 'inglés' : cvIdioma === 'pt' ? 'portugués' : cvIdioma === 'fr' ? 'francés' : cvIdioma.toUpperCase()}
              </button>
            </div>
            <button onClick={() => setAlertaIdioma(false)}
              className="mt-3 w-full text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal cancelar wizard ────────────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Warning size={20} weight="fill" className="text-amber-600" />
              </div>
              <h3 className="text-base font-black text-slate-800">¿Salir del formulario?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {modoForzado === 'upload'
                ? 'Perderás el progreso de optimización de este CV. Puedes volver al pilar Optimizador de CV y subir un CV distinto cuando quieras.'
                : 'Perderás lo que llevas escrito en este CV desde cero. Si ya tienes un CV listo, puedes subirlo desde el pilar Optimizador de CV y dejar que ELVIA® lo trabaje por ti.'}
            </p>
            <div className="flex flex-col gap-2">
              {modoForzado !== 'upload' && (
                <button
                  onClick={() => {
                    if (user) sessionStorage.removeItem(`cv_draft_${user.id}`)
                    setShowCancelModal(false)
                    navigate('/cv-desde-cero', { state: { mode: 'upload' }, replace: true })
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <UploadSimple size={14} weight="bold" /> Salir y subir mi CV
                </button>
              )}
              <button
                onClick={() => {
                  if (user) sessionStorage.removeItem(`cv_draft_${user.id}`)
                  setShowCancelModal(false)
                  navigate('/proyecto-laboral')
                }}
                className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold transition-colors cursor-pointer border border-rose-200"
              >
                Salir sin guardar
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors cursor-pointer"
              >
                Volver al formulario
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
