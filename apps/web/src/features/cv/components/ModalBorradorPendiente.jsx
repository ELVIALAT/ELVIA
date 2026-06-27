// features/cv/components/ModalBorradorPendiente.jsx
// Modal de decisión cuando entras con mode='scratch' y ya hay un borrador en BD.
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import { Notepad, ArrowUUpLeft } from '@phosphor-icons/react'
import { useCVWizard } from '../CVWizardContext'

export default function ModalBorradorPendiente() {
  const { continuarBorrador, descartarYEmpezar, setBorradorPendiente, navigate } = useCVWizard()
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-7">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Notepad size={20} weight="duotone" className="text-indigo-600" />
          </div>
          <h3 className="text-base font-black text-slate-800">Tienes un borrador en progreso</h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          Detectamos un CV que estabas construyendo antes. ¿Quieres continuar donde lo dejaste o empezar uno nuevo con la información actualizada de tu Gerente de Proyecto?
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={continuarBorrador}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            Continuar mi borrador
          </button>
          <button
            onClick={descartarYEmpezar}
            className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold transition-colors cursor-pointer border border-rose-200 flex items-center justify-center gap-2"
          >
            <ArrowUUpLeft size={14} weight="bold" /> Empezar uno nuevo (descarta el anterior)
          </button>
          <button
            onClick={() => { setBorradorPendiente(null); navigate('/proyecto-laboral') }}
            className="w-full py-2.5 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Volver al Optimizador
          </button>
        </div>
      </div>
    </div>
  )
}
