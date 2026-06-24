// features/cv/components/AlertaCVExistente.jsx
// Alerta cuando el usuario ya tiene un CV generado (sobrescribir vs volver).
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import { WarningCircle, ArrowLeft } from '@phosphor-icons/react'

export default function AlertaCVExistente({ navigate, setAlertaExistente }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <WarningCircle size={32} weight="bold" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">¡Ya tienes un CV hecho!</h2>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Detectamos que ya generaste tu CV profesional con nosotros.
          Si continúas, sobrescribiremos tu versión actual.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate('/proyecto-laboral')}
            className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
            <ArrowLeft size={18} weight="bold" /> Volver al Proyecto
          </button>
          <button onClick={() => setAlertaExistente(false)}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
            Crear uno nuevo de todas formas
          </button>
        </div>
      </div>
    </div>
  )
}
