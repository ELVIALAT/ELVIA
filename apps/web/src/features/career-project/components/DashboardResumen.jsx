// features/career-project/components/DashboardResumen.jsx
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 3).
import { Link } from 'react-router-dom'
import { CalendarCheck, FileText, ArrowRight, FileMagnifyingGlass, Target, ChartLine, Briefcase, Lock, CheckFat, X } from '@phosphor-icons/react'
import { calcularPorPilar } from '../../../utils/progresoLaboral'
import { PILARES, COLORES, RECURSOS_DEFAULT } from '../constants'

export default function DashboardResumen({ data, pct, onSelect, perfil, activePilar }) {
  const porPilar = calcularPorPilar(data, perfil)
  const bloques = (data&&data.semana&&data.semana.bloques) ? data.semana.bloques : {}
  const horas = Object.values(bloques).filter(Boolean).length * 2
  const rec = (data&&data.recursos&&data.recursos.recursos) ? data.recursos.recursos : RECURSOS_DEFAULT
  const costoTotal = rec.reduce(function(s,r){return s+(Number(r.costo)||0)},0)
  const auto = (data&&data.autoconocimiento) ? data.autoconocimiento : {}
  const cvGenerado = data && data.optimizer && data.optimizer.cv_generado

  const CORE_IDS = ['perfil','autoconocimiento','recursos','semana','oferta','documentos']
  const isUnlocked = pct >= 100

  const statusLabel = pct===100?'Estratega Completo':pct>=80?'Muy avanzado':pct>=50?'En progreso':pct>0?'Iniciado':'Sin inicio'
  const statusColor = pct===100?'text-emerald-600 bg-emerald-50 border-emerald-200':pct>=50?'text-amber-600 bg-amber-50 border-amber-200':'text-violet-600 bg-violet-50 border-violet-200'

  const kpis = [
    { label:'Horas / sem',   value: horas>0?horas+'h':'—',                              icon:CalendarCheck, color:'text-teal-500',  bg:'bg-teal-50'   },
    { label:'CV Inicial',    value: cvGenerado ? '✓ Generado' : 'Pendiente',            icon:FileMagnifyingGlass, color:'text-amber-500', bg:'bg-amber-50'  },
    { label:'Costo mensual', value: costoTotal>0?'$'+costoTotal.toLocaleString():'—',   icon:Briefcase,     color:'text-blue-500',  bg:'bg-blue-50'   },
    { label:'Industrias',    value: Array.isArray(auto.industrias)&&auto.industrias.length>0?auto.industrias[0]:'—', icon:Target, color:'text-violet-500', bg:'bg-violet-50', small:true },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <ChartLine size={16} weight="duotone" className="text-violet-600" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Mi Proyecto Laboral</p>
            <p className="text-sm font-bold text-slate-800 leading-tight">Resumen de avance</p>
          </div>
        </div>
        <span className={'text-[11px] font-bold px-3 py-1 rounded-full border ' + statusColor}>{statusLabel}</span>
      </div>

      {/* ── KPI strip ── */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-5">
          {/* Círculo de progreso */}
          <div className="relative w-[72px] h-[72px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" strokeWidth="7" stroke="#f1f5f9" fill="none"/>
              <circle cx="36" cy="36" r="28" strokeWidth="7"
                stroke={pct>=60?'#10b981':pct>=40?'#f59e0b':'#7c3aed'}
                strokeLinecap="round" fill="none"
                strokeDasharray={`${2*Math.PI*28}`}
                strokeDashoffset={`${2*Math.PI*28*(1-pct/100)}`}
                style={{transition:'stroke-dashoffset 0.8s ease'}}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black text-slate-800 leading-none">{pct}%</span>
              <span className="text-[8px] font-semibold text-slate-400 uppercase tracking-wide">total</span>
            </div>
          </div>

          {/* Separador */}
          <div className="w-px h-12 bg-slate-200 shrink-0"/>

          {/* KPIs */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
            {kpis.map(function(k){
              const Icon = k.icon
              return (
                <div key={k.label} className="flex items-center gap-2.5 min-w-0">
                  <div className={'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ' + k.bg}>
                    <Icon size={14} weight="duotone" className={k.color}/>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none">{k.label}</p>
                    <p className={'font-black text-slate-800 mt-0.5 leading-tight ' + (k.small?'text-xs truncate':'text-sm')}>{k.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Banner de calidad del perfil */}
        {isUnlocked && (
          <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <CheckFat size={16} weight="fill" className="text-emerald-600 shrink-0"/>
            <p className="text-xs font-bold text-emerald-700">Perfil al 100% — tu CV tendrá la máxima calidad. Genera tu CV Inicial cuando estés listo.</p>
          </div>
        )}
        {!isUnlocked && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[10px] font-semibold text-slate-400">Calidad de tu perfil para el CV — tómate tu tiempo</p>
              <p className="text-[10px] font-bold text-violet-600">{pct}%</p>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-rose-400 rounded-full transition-all duration-700"
                style={{width: pct+'%'}}/>
            </div>
          </div>
        )}
      </div>

      {/* ── Pilares grid 3x2 ── */}
      <div className="px-6 py-5">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">6 Pilares del proyecto</p>
        <div className="grid grid-cols-3 gap-3">
          {PILARES.map(function(p) {
            const pp = porPilar[p.id] || 0
            const c  = COLORES[p.color]
            const Icon = p.icon
            const isActive = activePilar === p.id

            const pilarIndex = PILARES.findIndex(function(pl){ return pl.id === p.id })
            const prevPilar  = pilarIndex > 0 ? PILARES[pilarIndex - 1] : null
            const prevPct    = prevPilar ? (porPilar[prevPilar.id] || 0) : 100
            const isLocked   = pilarIndex > 0 && prevPct < 100 && pp === 0

            const tooltipMsg = isLocked
              ? ('Completa ' + prevPilar.label + ' primero (' + prevPct + '% completado)')
              : p.id==='documentos'
                ? (pp===100 ? '¡CV Inicial generado!' : 'Genera tu CV cuando estés listo — cuanto más completo tu perfil, mejor resultado')
                : (pp===100 ? '¡Sección completa!' : 'Te falta '+(100-pp)+'% para terminar')

            return (
              <button key={p.id} onClick={function(){ if(!isLocked) onSelect(p.id) }}
                title={tooltipMsg}
                className={'group relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center '
                  + (isLocked
                    ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
                    : isActive
                    ? 'cursor-pointer shadow-md border-current ' + c.soft
                    : 'cursor-pointer hover:shadow-md border-transparent hover:border-current ' + c.soft)}
              >
                {/* Candado */}
                {isLocked && (
                  <div className="absolute top-2 right-2">
                    <Lock size={12} weight="fill" className="text-slate-400"/>
                  </div>
                )}

                {/* Badge ★ Oferta de Valor */}
                {p.id==='oferta' && !isLocked && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white shadow-sm whitespace-nowrap">★ Clave para tu CV</span>
                  </div>
                )}

                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <div className="bg-slate-800 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg max-w-[200px] text-center leading-snug">
                    {tooltipMsg}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"/>
                </div>

                {/* Icono */}
                <div className={'w-10 h-10 rounded-xl flex items-center justify-center ' + (isLocked ? 'bg-slate-200' : c.badge)}>
                  <Icon size={18} weight="duotone" className={isLocked ? 'text-slate-400' : c.icon} />
                </div>

                {/* Label */}
                <p className={'text-[11px] font-bold leading-tight ' + (isLocked ? 'text-slate-400' : 'text-slate-700')} style={{wordBreak:'break-word'}}>
                  {p.label}
                </p>

                {/* Barra de progreso */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={'h-full rounded-full transition-all duration-500 ' + (isLocked ? 'bg-slate-300' : c.bar)} style={{width:pp+'%'}} />
                </div>

                <span className={'text-xs font-black ' + (isLocked ? 'text-slate-400' : c.icon)}>{pp}%</span>
              </button>
            )
          })}
        </div>

        {/* ── Botón transversal Mis Documentos ── */}
        <div className="mt-3">
          {isUnlocked ? (
            <Link to="/mis-cvs"
              className="flex items-center justify-between w-full px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm hover:shadow-md hover:from-amber-600 hover:to-amber-700 transition-all group/docs"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} weight="duotone" className="shrink-0"/>
                <span className="text-xs font-black tracking-wide">Mis Documentos</span>
                <span className="text-[10px] font-medium opacity-80 hidden sm:inline">· Tu CV Inicial y materiales de candidatura</span>
              </div>
              <ArrowRight size={14} className="group-hover/docs:translate-x-1 transition-transform shrink-0"/>
            </Link>
          ) : (
            <div className="flex items-center justify-between w-full px-5 py-3 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200"
              title="Completa tu perfil al 100% para acceder a Mis Documentos"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-slate-300 shrink-0"/>
                <span className="text-xs font-bold text-slate-400 tracking-wide">Mis Documentos</span>
                <span className="text-[10px] text-slate-300 hidden sm:inline">· Disponible cuando tu perfil esté al 100%</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full shrink-0">{pct}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
