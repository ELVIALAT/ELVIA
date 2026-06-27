// features/career-project/components/PilarOptimizadorCV.jsx
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 3).
import { Link } from 'react-router-dom'
import { ArrowRight, FileMagnifyingGlass, UploadSimple, CheckFat } from '@phosphor-icons/react'

export default function PilarOptimizadorCV({ pct }) {
  const allDone = pct >= 100
  return (
    <div className="space-y-5">
      {/* Callout calidad — sin urgencia */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-800 font-medium leading-relaxed">
          Tu CV se nutre de todo lo que has construido aquí. Cuanto más completo esté tu perfil, más poderoso será el resultado.
          Tómate el tiempo de pulir cada sección — sobre todo <span className="font-black text-amber-900">Mi Oferta de Valor</span>, que es tu propuesta diferencial.
        </p>
      </div>

      {/* Indicador de calidad */}
      {allDone ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckFat size={20} weight="fill" className="text-emerald-600 shrink-0"/>
          <div>
            <p className="text-sm font-black text-emerald-800">¡Perfil al 100%!</p>
            <p className="text-xs text-emerald-600 mt-0.5">Tu CV tendrá toda la información necesaria para destacar.</p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold text-slate-600">Calidad de tu perfil para el CV</p>
            <span className="text-xs font-black text-violet-600">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-rose-500 rounded-full transition-all duration-700" style={{width:pct+'%'}}/>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Puedes generar tu CV en cualquier momento — a mayor completitud, mejor resultado.</p>
        </div>
      )}

      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pt-1">¿Cómo quieres generar tu CV?</p>

      {/* Card A: Subir mi CV */}
      <Link to="/cv-desde-cero" state={{ mode: 'upload' }}
        className="flex items-start gap-4 p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50 hover:border-indigo-400 hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <UploadSimple size={22} weight="duotone" className="text-white"/>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-800 text-sm mb-1">Subir mi CV actual</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Sube tu CV en PDF o Word. ELVIA® lo analiza, extrae tu información y la optimiza automáticamente con todo tu perfil.</p>
        </div>
        <ArrowRight size={16} className="text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0 mt-1"/>
      </Link>

      {/* Card B: Empezar de cero */}
      <Link to="/cv-desde-cero" state={{ mode: 'scratch' }}
        className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:scale-105 transition-all">
          <FileMagnifyingGlass size={22} weight="duotone" className="text-slate-500 group-hover:text-indigo-600 transition-colors"/>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-slate-800 text-sm mb-1">Empezar de cero</h3>
          <p className="text-xs text-slate-500 leading-relaxed">Construye tu CV paso a paso con el wizard de ELVIA®. Formato Harvard ATS-friendly, con previsualización antes de generar.</p>
        </div>
        <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0 mt-1"/>
      </Link>
    </div>
  )
}
