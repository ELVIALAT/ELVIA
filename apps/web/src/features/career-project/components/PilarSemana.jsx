// features/career-project/components/PilarSemana.jsx
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 3).
import { useState } from 'react'
import { CheckCircle, CheckFat, WarningCircle } from '@phosphor-icons/react'
import { DIAS, HORARIOS } from '../constants'

export default function PilarSemana({ data, onChange, onSave, justSaved }) {
  const d = data||{}
  const dias = Array.isArray(d.dias)?d.dias:[]
  const bloques = d.bloques||{}
  const toggleDia = function(dia){ onChange(Object.assign({},d,{dias:dias.includes(dia)?dias.filter(function(x){return x!==dia}):dias.concat([dia])})) }
  const toggleB = function(dia,h){ const k=dia+'_'+h; onChange(Object.assign({},d,{bloques:Object.assign({},bloques,{[k]:!bloques[k]})})) }
  const totalH = Object.values(bloques).filter(Boolean).length*2
  const bench = totalH>=15?'green':totalH>=8?'amber':'red'
  const [modalIncompleto, setModalIncompleto] = useState(null)

  function handleSave() {
    const bN = Object.values(bloques).filter(Boolean).length
    if (bN < 1) { setModalIncompleto(['Agrega al menos 1 bloque de horas en tu horario semanal']) }
    else { onSave(d) }
  }
  return (
    <div className="space-y-8">
      <div className="p-5 rounded-2xl bg-teal-50 border border-teal-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          <span className="text-teal-700 font-bold">Trátalo como un trabajo de medio tiempo.</span>{' '}
          Los candidatos exitosos dedican consistentemente <strong>15+ horas/semana</strong> a su búsqueda.
        </p>
      </div>
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Días activos de búsqueda</h3>
        <div className="flex flex-wrap gap-2">
          {DIAS.map(function(d){ const sel=dias.includes(d); return (
            <button key={d} onClick={function(){toggleDia(d)}} className={'w-14 h-14 rounded-2xl font-bold text-sm transition-all border-2 cursor-pointer '+(sel?'bg-teal-600 text-white border-teal-600 shadow-sm':'border-slate-200 text-slate-500 hover:border-teal-400')}>{d}</button>
          )})}
        </div>
      </div>
      {dias.length>0&&(
        <div className="overflow-x-auto">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Bloques de 2 horas por día</h3>
          <table className="min-w-[480px]">
            <thead><tr>
              <th className="text-left text-[10px] text-slate-400 pb-2 pr-4 font-semibold">Horario</th>
              {dias.map(function(d){return <th key={d} className="text-center text-xs text-slate-600 pb-2 px-2 font-bold">{d}</th>})}
            </tr></thead>
            <tbody>
              {HORARIOS.map(function(h){return(
                <tr key={h}>
                  <td className="text-xs text-slate-500 pr-4 py-1.5 whitespace-nowrap">{h}</td>
                  {dias.map(function(d){ const k=d+'_'+h; const act=bloques[k]; return(
                    <td key={d} className="px-2 py-1.5 text-center">
                      <button onClick={function(){toggleB(d,h)}} className={'w-8 h-8 rounded-lg mx-auto block transition-all border-2 cursor-pointer '+(act?'bg-teal-500 border-teal-500':'border-slate-200 hover:border-teal-400')}>
                        {act&&<CheckCircle size={16} weight="fill" className="text-white mx-auto"/>}
                      </button>
                    </td>
                  )})}
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}
      {totalH>0&&(
        <div className={'p-5 rounded-2xl border-2 flex items-center justify-between '+(bench==='green'?'bg-teal-50 border-teal-200':bench==='amber'?'bg-amber-50 border-amber-200':'bg-red-50 border-red-200')}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Horas por semana</p>
            <p className={'text-sm font-semibold mt-0.5 '+(bench==='green'?'text-teal-700':bench==='amber'?'text-amber-700':'text-red-600')}>
              {bench==='green'?'Excelente — en la zona de éxito':bench==='amber'?'Bien, agrega algunos bloques más':'Muy poco — el proceso tomará más tiempo'}
            </p>
          </div>
          <p className={'text-3xl font-black '+(bench==='green'?'text-teal-600':bench==='amber'?'text-amber-600':'text-red-500')}>{totalH}h</p>
        </div>
      )}

      {/* Botón de guardar */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${justSaved?'bg-emerald-600 text-white':'bg-teal-600 hover:bg-teal-700 text-white'}`}>
          {justSaved ? (<><CheckFat size={16} weight="fill"/> Guardado</>) : 'Guardar'}
        </button>
      </div>

      {modalIncompleto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(15,10,40,0.55)',backdropFilter:'blur(4px)'}} onClick={function(e){if(e.target===e.currentTarget)setModalIncompleto(null)}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-t-3xl flex items-center gap-3">
              <WarningCircle size={24} className="text-white" weight="fill"/>
              <div><h2 className="text-white font-bold text-base leading-tight">Sección incompleta</h2><p className="text-teal-100 text-xs mt-0.5">Horario semanal no tiene bloques definidos</p></div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">Para guardar correctamente y reflejar tu progreso, completa:</p>
              <ul className="space-y-2 mb-6">{modalIncompleto.map(function(item,i){return(<li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">!</span>{item}</li>)})}</ul>
              <div className="flex gap-3">
                <button onClick={function(){setModalIncompleto(null)}} className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors cursor-pointer">Volver a completar</button>
                <button onClick={function(){setModalIncompleto(null);onSave(d)}} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer">Guardar así</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
