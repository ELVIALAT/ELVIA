// features/career-project/components/FeaturePreviewGrid.jsx
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 3).
import { Heart, LinkedinLogo, FileMagnifyingGlass, MagnifyingGlass, ChartLine, Briefcase, Lock, Sparkle, MicrophoneStage, Books, Kanban, BookmarkSimple, Folders, UsersThree } from '@phosphor-icons/react'

const FEATURES_PREVIEW=[
  {label:'CV Optimizer',desc:'Analiza y mejora tu CV con IA',Icon:FileMagnifyingGlass,color:'violet'},
  {label:'LinkedIn Optimo',desc:'Optimiza tu perfil para reclutadores',Icon:LinkedinLogo,color:'blue'},
  {label:'CV vs Vacante',desc:'Compara tu CV con cualquier vacante',Icon:MagnifyingGlass,color:'teal'},
  {label:'Buscar Vacantes',desc:'Encuentra oportunidades personalizadas',Icon:Briefcase,color:'indigo'},
  {label:'Entrevistas IA',desc:'Practica con entrevistas simuladas',Icon:MicrophoneStage,color:'rose'},
  {label:'Mis documentos',desc:'Gestiona tus CVs, reportes e infografías',Icon:Folders,color:'amber'},
  {label:'Mis Vacantes',desc:'Guarda y organiza empleos de interés',Icon:BookmarkSimple,color:'green'},
  {label:'Pipeline',desc:'Haz seguimiento a tus postulaciones',Icon:Kanban,color:'purple'},
  {label:'Biblioteca',desc:'Recursos y guías de búsqueda laboral',Icon:Books,color:'slate'},
  {label:'Bienestar',desc:'Mindfulness y ejercicios para el proceso',Icon:Heart,color:'rose'},
  {label:'Mentor Experto',desc:'Acceso a mentores de carrera',Icon:UsersThree,color:'orange'},
  {label:'Dashboard',desc:'Vista centralizada de tu progreso',Icon:ChartLine,color:'violet'},
]
const FC={violet:'bg-violet-50 border-violet-200 text-violet-700',blue:'bg-blue-50 border-blue-200 text-blue-700',teal:'bg-teal-50 border-teal-200 text-teal-700',indigo:'bg-indigo-50 border-indigo-200 text-indigo-700',rose:'bg-rose-50 border-rose-200 text-rose-700',amber:'bg-amber-50 border-amber-200 text-amber-700',green:'bg-emerald-50 border-emerald-200 text-emerald-700',purple:'bg-purple-50 border-purple-200 text-purple-700',slate:'bg-slate-100 border-slate-200 text-slate-600',orange:'bg-orange-50 border-orange-200 text-orange-700'}

export default function FeaturePreviewGrid() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-violet-50/30 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkle size={18} weight="duotone" className="text-violet-600"/>
        </div>
        <div>
          <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-0.5">Lo que te espera</p>
          <h3 className="font-black text-slate-800 text-base leading-snug">Completa tu perfil para desbloquear todas las herramientas</h3>
          <p className="text-xs text-slate-500 mt-1">Una vez que termines el Gerente de Búsqueda, toda la plataforma se activa automáticamente.</p>
        </div>
      </div>
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {FEATURES_PREVIEW.map(f=>{
          const Icon=f.Icon
          const c=FC[f.color]||FC.slate
          return(
            <div key={f.label} className={'relative rounded-2xl border-2 p-4 flex flex-col gap-2 opacity-60 '+c}>
              <div className="flex items-center justify-between"><Icon size={22} weight="duotone"/><Lock size={14} weight="bold" className="text-slate-400"/></div>
              <p className="font-bold text-sm leading-snug">{f.label}</p>
              <p className="text-xs opacity-80 leading-snug">{f.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
