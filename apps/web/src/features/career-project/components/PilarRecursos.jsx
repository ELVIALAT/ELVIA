// features/career-project/components/PilarRecursos.jsx
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 3).
import { useState } from 'react'
import { PlusMinus, Trash, CheckFat, WarningCircle } from '@phosphor-icons/react'
import { MONEDAS_LIST, PRECIO_OPTIMA_MXN, RECURSOS_DEFAULT } from '../constants'
import { detectarMoneda, convertirDesdeMXN } from '../utils'

export default function PilarRecursos({ data, onChange, onSave, justSaved, pais }) {
  const rawArr = data ? (Array.isArray(data) ? data : (Array.isArray(data.recursos) ? data.recursos : null)) : null
  const recursos = (rawArr && rawArr.length > 0) ? rawArr : RECURSOS_DEFAULT
  const [modalIncompleto, setModalIncompleto] = useState(null)

  const moneda = detectarMoneda(pais)
  const upR = function(id,f,v){onChange({recursos:recursos.map(function(r){return r.id===id?Object.assign({},r,{[f]:v}):r})})}
  const addR = function(){onChange({recursos:recursos.concat([{id:String(Date.now()),nombre:'',descripcion:'',costo:0,tengo:false}])})}
  const delR = function(id){onChange({recursos:recursos.filter(function(r){return r.id!==id})})}
  const totalAll = recursos.reduce(function(s,r){return s+(Number(r.costo)||0)},0)
  const monedaSymbol = MONEDAS_LIST.find(function(m){return m.code===moneda})?.symbol || '$'

  function handleSave() {
    const activos = recursos.filter(function(r){return r.tengo===true}).length
    if (activos < 1) { setModalIncompleto(['Marca al menos 1 recurso que ya tienes disponible']) }
    else { onSave({ recursos }) }
  }

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
        <p className="text-sm text-slate-700 leading-relaxed">
          <span className="text-blue-700 font-bold">¿Cuánto cuesta tu búsqueda laboral?</span>{' '}
          Identifica lo que ya tienes y lo que aún necesitas. Todos los costos son <strong>mensuales en {moneda}</strong>.
        </p>
      </div>
      <div className="space-y-2.5">
        {recursos.filter(function(r){ return !r.b2cOnly }).map(function(r){
          const isOptima = r.id==='optima'
          const optimaValor = isOptima && r.tengo ? convertirDesdeMXN(PRECIO_OPTIMA_MXN['free'], moneda) : r.costo
          return(
          <div key={r.id} className={'border rounded-2xl p-4 transition-all '+(r.tengo?'bg-green-50 border-green-200':'bg-white border-slate-200')}>
            <div className="flex items-center gap-4">
              <button onClick={function(){
                const newTengo = !r.tengo
                if (!newTengo) {
                  onChange({recursos:recursos.map(function(res){return res.id===r.id?Object.assign({},res,{tengo:false,costo:0}):res})})
                } else {
                  upR(r.id,'tengo',newTengo)
                }
              }} className={'w-10 h-5.5 rounded-full relative shrink-0 transition-colors cursor-pointer '+(r.tengo?'bg-green-500':'bg-slate-300')} style={{height:22}}>
                <span className={'absolute top-[3px] w-4 h-4 bg-white rounded-full shadow transition-all '+(r.tengo?'right-[3px]':'left-[3px]')}/>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <input value={r.nombre} onChange={function(e){upR(r.id,'nombre',e.target.value)}} disabled={!r.tengo}
                      placeholder="Nombre del recurso"
                      className="font-semibold text-sm text-slate-800 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 w-full disabled:text-slate-400 disabled:cursor-not-allowed"/>
                    <input value={r.descripcion||''} onChange={function(e){upR(r.id,'descripcion',e.target.value)}} disabled={!r.tengo}
                      placeholder="Describe para qué lo necesitas..."
                      className="text-xs text-slate-500 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-200 w-full mt-0.5 disabled:text-slate-300 disabled:cursor-not-allowed"/>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2.5 py-1.5">
                      <span className="text-xs text-slate-500">{monedaSymbol}</span>
                      <input type="number" value={isOptima && r.tengo ? optimaValor : r.costo} onChange={function(e){if(!isOptima || !r.tengo){const v=e.target.value; if(v===''||!isNaN(v)&&Number(v)>=0) upR(r.id,'costo',v)}}} disabled={!r.tengo || (isOptima && r.tengo)}
                        className="w-14 text-xs text-slate-700 font-bold bg-transparent focus:outline-none text-right disabled:text-slate-400 disabled:cursor-not-allowed" min="0"/>
                      <span className="text-xs text-slate-400">{moneda}</span>
                    </div>
                    {!r.obligatorio && <button onClick={function(){delR(r.id)}} className="text-slate-300 hover:text-red-400 transition-colors p-1 cursor-pointer">
                      <Trash size={14}/>
                    </button>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>
      <button onClick={addR} className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-dashed border-blue-300 rounded-xl px-4 py-3 hover:border-blue-400 transition-colors w-full justify-center cursor-pointer">
        <PlusMinus size={16}/> Agregar recurso
      </button>
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Total mensual</p>
        <p className="text-2xl font-black text-slate-800">{monedaSymbol}{totalAll.toLocaleString()} <span className="text-sm text-slate-400 font-normal">{moneda}</span></p>
      </div>

      {/* Botón de guardar */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${justSaved?'bg-emerald-600 text-white':'bg-blue-600 hover:bg-blue-700 text-white'}`}>
          {justSaved ? (<><CheckFat size={16} weight="fill"/> Guardado</>) : 'Guardar'}
        </button>
      </div>

      {modalIncompleto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(15,10,40,0.55)',backdropFilter:'blur(4px)'}} onClick={function(e){if(e.target===e.currentTarget)setModalIncompleto(null)}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-3xl flex items-center gap-3">
              <WarningCircle size={24} className="text-white" weight="fill"/>
              <div><h2 className="text-white font-bold text-base leading-tight">Sección incompleta</h2><p className="text-blue-100 text-xs mt-0.5">Recursos tiene campos sin completar</p></div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">Para guardar correctamente y reflejar tu progreso, completa:</p>
              <ul className="space-y-2 mb-6">{modalIncompleto.map(function(item,i){return(<li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">!</span>{item}</li>)})}</ul>
              <div className="flex gap-3">
                <button onClick={function(){setModalIncompleto(null)}} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors cursor-pointer">Volver a completar</button>
                <button onClick={function(){setModalIncompleto(null);onSave({ recursos })}} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer">Guardar así</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
