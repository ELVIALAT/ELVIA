// features/career-project/components/PanelCompensacion.jsx
// Sub-panel de PilarMiPerfil (tab Compensación). Extraído verbatim (Fase 3 refinamiento).
import { CheckCircle, SpinnerGap } from '@phosphor-icons/react'
import { MEXICO_DETALLE, MONEDAS_LIST, MONEDAS_US, PAISES_LATAM } from '../constants'
import { detectarMoneda, formatearMonto, getPrestaciones, parseMonto, soloNumericos } from '../utils'
import HelpBadge from '../../../components/common/HelpBadge'

export default function PanelCompensacion({ d, justSaved, lp, onSavePerfilLocal, saving, setLP }) {
  return (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-sm font-black text-slate-800">Compensación del Proyecto</h3>
            <HelpBadge id="proyecto.comp" />
          </div>
          {/* País para prestaciones */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">País (para prestaciones)</label>
            <select value={lp.pais_prestaciones||''} onChange={e=>{
              const p=e.target.value
              setLP(f=>({...f,pais_prestaciones:p,moneda:detectarMoneda(p)||f.moneda,prestaciones:[],prestaciones_detalle:{}}))
            }} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40">
              <option value="">Selecciona</option>
              {PAISES_LATAM.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Salario */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Salario bruto mensual</label>
            <div className="flex gap-2">
              <select value={lp.moneda||''} onChange={e=>setLP(f=>({...f,moneda:e.target.value}))}
                className="border border-slate-300 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 shrink-0">
                <option value="">Moneda</option>
                {MONEDAS_LIST.map(m=><option key={m.code} value={m.code}>{m.code}</option>)}
              </select>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none">
                  {MONEDAS_LIST.find(m=>m.code===lp.moneda)?.symbol||'$'}
                </span>
                <input type="text" value={lp.salario_monto||''}
                  onChange={e=>setLP(f=>({...f,salario_monto:soloNumericos(e.target.value,f.moneda)}))}
                  onBlur={()=>setLP(f=>({...f,salario_monto:formatearMonto(f.salario_monto,f.moneda)}))}
                  placeholder={MONEDAS_US.includes(lp.moneda)?'50,000':'50.000'}
                  className="w-full border border-slate-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/>
              </div>
            </div>
          </div>

          {/* Prestaciones */}
          {lp.pais_prestaciones&&(
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                Prestaciones{lp.pais_prestaciones?` — ${lp.pais_prestaciones}`:''}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {getPrestaciones(lp.pais_prestaciones).map(p=>{
                  const salarioNum=parseMonto(lp.salario_monto,lp.moneda)
                  const detailCfg=lp.pais_prestaciones==='México'?MEXICO_DETALLE[p]:null
                  const isChecked=lp.prestaciones.includes(p)
                  const updateDetalle=(key,val)=>setLP(f=>({...f,prestaciones_detalle:{...f.prestaciones_detalle,[key]:val}}))
                  return(
                    <div key={p}>
                      {p==='Días de vacaciones' ? (
                        <>
                          <div className="flex items-center gap-2 p-2 rounded-lg border border-indigo-200 bg-indigo-50 text-xs text-indigo-800 font-medium">
                            {p}
                          </div>
                          <div className="mt-1 px-1">
                            <div className="flex items-center gap-1">
                              <input type="text" inputMode="numeric"
                                value={lp.prestaciones_detalle[p]!==undefined?lp.prestaciones_detalle[p]:'12'}
                                onChange={e=>updateDetalle(p,e.target.value.replace(/[^0-9]/g,''))}
                                placeholder="12"
                                className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                              <span className="text-xs text-slate-400 shrink-0">días</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs ${isChecked?'bg-indigo-50 border-indigo-300 text-indigo-800 font-medium':'border-slate-200 text-slate-600 hover:border-slate-400'}`}>
                            <input type="checkbox" checked={isChecked} onChange={()=>setLP(f=>({...f,prestaciones:f.prestaciones.includes(p)?f.prestaciones.filter(x=>x!==p):[...f.prestaciones,p]}))}
                              className="accent-indigo-600 shrink-0"/>
                            {p}
                          </label>
                          {isChecked&&detailCfg&&(
                            <div className="mt-1 px-1">
                              {detailCfg.tipo==='selector'?(
                                <select value={lp.prestaciones_detalle[p]??detailCfg.default} onChange={e=>updateDetalle(p,e.target.value)}
                                  className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400">
                                  {detailCfg.opciones.map(o=><option key={o} value={o}>{o}</option>)}
                                </select>
                              ):(
                                <div className="flex items-center gap-1">
                                  <input type="text" inputMode="decimal"
                                    value={lp.prestaciones_detalle[p]??detailCfg.default}
                                    onChange={e=>{
                                      const val=detailCfg.tipo==='monto'?soloNumericos(e.target.value,lp.moneda):e.target.value.replace(/[^0-9.]/g,'')
                                      updateDetalle(p,val)
                                    }}
                                    onBlur={()=>{
                                      if(detailCfg.tipo==='monto'){
                                        const val=lp.prestaciones_detalle[p]??''
                                        updateDetalle(p,formatearMonto(String(val),lp.moneda))
                                      }
                                    }}
                                    placeholder={detailCfg.tipo==='monto'?(MONEDAS_US.includes(lp.moneda)?'10,000':'10.000'):detailCfg.label}
                                    className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                                  {detailCfg.tipo==='pct'&&<span className="text-xs text-slate-400 shrink-0">%</span>}
                                  {detailCfg.tipo==='dias'&&<span className="text-xs text-slate-400 shrink-0">días</span>}
                                </div>
                              )}
                              {/* Calculation display for Aguinaldo */}
                              {p==='Aguinaldo'&&salarioNum>0&&(()=>{
                                const dias=parseFloat(lp.prestaciones_detalle[p]||detailCfg.default||'30')||30
                                const calc=Math.round(salarioNum/30*dias)
                                return <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1 font-semibold mt-1">≈ {formatearMonto(String(calc),lp.moneda)} {lp.moneda} anuales</div>
                              })()}
                              {/* Calculation display for Prima vacacional */}
                              {p==='Prima vacacional'&&salarioNum>0&&(()=>{
                                const pct=parseFloat(lp.prestaciones_detalle[p]||detailCfg.default||'25')||25
                                const diasVac=parseInt(lp.prestaciones_detalle['Días de vacaciones']||d.dias_vacaciones||'12')||12
                                const calc=Math.round(salarioNum/30*diasVac*(pct/100))
                                return <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1 font-semibold mt-1">≈ {formatearMonto(String(calc),lp.moneda)} {lp.moneda} anuales</div>
                              })()}
                              {/* Monto field for Fondo de ahorro */}
                              {p==='Fondo de ahorro'&&(
                                <div className="mt-1">
                                  <label className="block text-[10px] text-slate-500 mb-0.5">Monto mensual ({lp.moneda||'$'})</label>
                                  <input type="text" inputMode="decimal"
                                    value={lp.fondo_ahorro_monto||''}
                                    onChange={e=>setLP(f=>({...f,fondo_ahorro_monto: soloNumericos(e.target.value, lp.moneda)}))}
                                    onBlur={()=>setLP(f=>({...f,fondo_ahorro_monto: formatearMonto(lp.fondo_ahorro_monto||'', lp.moneda)}))}
                                    placeholder={MONEDAS_US.includes(lp.moneda)?'2,000':'2.000'}
                                    className="w-full border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}



          {/* Bonos / Variables — múltiples */}
          {(()=>{
            const salarioNum = parseMonto(lp.salario_monto, lp.moneda)
            const bonosExtra = Array.isArray(lp.bonos_extra) ? lp.bonos_extra : []

            const calcBonoMonto = function(b) {
              const mult={'Mensual':1,'Trimestral':3,'Semestral':6,'Anual':12}[b.frecuencia]||1
              if (b.esquema==='%'&&b.pct&&b.frecuencia) return salarioNum*mult*(parseFloat(b.pct)/100)
              if (b.esquema==='Número de salarios'&&b.num_salarios) return parseFloat(b.num_salarios)*salarioNum
              return null
            }

            const BonoCard = function({bono, isMain, idx}) {
              const calc = calcBonoMonto(bono)
              const fmtCalc = calc !== null ? formatearMonto(String(Math.round(calc)), lp.moneda) : null
              const upField = isMain
                ? function(key,val){ setLP(function(f){ return {...f,['bono_'+key]:val} }) }
                : function(key,val){ setLP(function(f){ return {...f, bonos_extra: f.bonos_extra.map(function(b,i){ return i===idx?{...b,[key]:val}:b }) } }) }
              const resetTipo = isMain
                ? function(t){ setLP(function(f){ return {...f,bono_tipo:t,bono_esquema:'',bono_pct:'',bono_num_salarios:'',bono_monto:''} }) }
                : function(t){ setLP(function(f){ return {...f, bonos_extra: f.bonos_extra.map(function(b,i){ return i===idx?{...b,tipo:t,esquema:'',frecuencia:'',pct:'',num_salarios:'',monto:'',variable_monto:''}:b }) } }) }
              const resetEsq = isMain
                ? function(e){ setLP(function(f){ return {...f,bono_esquema:e,bono_pct:'',bono_num_salarios:'',bono_monto:''} }) }
                : function(e){ setLP(function(f){ return {...f, bonos_extra: f.bonos_extra.map(function(b,i){ return i===idx?{...b,esquema:e,pct:'',num_salarios:'',monto:''}:b }) } }) }

              return (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  {!isMain&&(
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">Bono / Variable {idx+2}</span>
                      <button onClick={function(){ setLP(function(f){ return {...f, bonos_extra: f.bonos_extra.filter(function(_,i){ return i!==idx })} }) }}
                        className="text-xs text-red-500 hover:text-red-700 cursor-pointer">✕ Eliminar</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {['Bono','Variable mensual'].map(function(t){
                      return (
                        <button key={t} onClick={function(){ resetTipo(t) }}
                          className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors cursor-pointer ${bono.tipo===t?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>
                          {t}
                        </button>
                      )
                    })}
                  </div>
                  {bono.tipo==='Bono'&&(
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Frecuencia</label>
                          <select value={bono.frecuencia||''} onChange={function(e){ upField('frecuencia',e.target.value) }}
                            className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400">
                            <option value="">Selecciona</option>
                            {['Mensual','Trimestral','Semestral','Anual'].map(function(f){ return <option key={f} value={f}>{f}</option> })}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Esquema</label>
                          <select value={bono.esquema||''} onChange={function(e){ resetEsq(e.target.value) }}
                            className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400">
                            <option value="">Selecciona</option>
                            <option value="%">% del salario anual</option>
                            <option value="Número de salarios">Número de salarios</option>
                            <option value="Valor">Valor fijo</option>
                          </select>
                        </div>
                      </div>
                      {bono.esquema==='%'&&(
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Porcentaje %</label>
                            <input type="text" value={bono.pct||''} onChange={function(e){ upField('pct',e.target.value.replace(/[^0-9.]/g,'')) }} placeholder="10"
                              className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Estimado ({lp.moneda})</label>
                            <input type="text" readOnly value={fmtCalc||''} placeholder="Automático"
                              className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs bg-slate-100 text-slate-500 focus:outline-none"/>
                          </div>
                        </div>
                      )}
                      {bono.esquema==='Número de salarios'&&(
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Núm. de salarios</label>
                            <input type="text" value={bono.num_salarios||''} onChange={function(e){ upField('num_salarios',e.target.value.replace(/[^0-9.]/g,'')) }} placeholder="3"
                              className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Estimado ({lp.moneda})</label>
                            <input type="text" readOnly value={fmtCalc||''} placeholder="Automático"
                              className="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs bg-slate-100 text-slate-500 focus:outline-none"/>
                          </div>
                        </div>
                      )}
                      {bono.esquema==='Valor'&&(
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Monto ({lp.moneda})</label>
                          <input type="text" value={bono.monto||''}
                            onChange={function(e){ upField('monto',soloNumericos(e.target.value,lp.moneda)) }}
                            onBlur={function(){ upField('monto',formatearMonto(bono.monto||'',lp.moneda)) }}
                            placeholder={MONEDAS_US.includes(lp.moneda)?'50,000':'50.000'}
                            className="w-full border border-slate-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                        </div>
                      )}
                    </div>
                  )}
                  {bono.tipo==='Variable mensual'&&(
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Monto mensual ({lp.moneda})</label>
                      <input type="text" value={bono.variable_monto||''}
                        onChange={function(e){ upField('variable_monto',soloNumericos(e.target.value,lp.moneda)) }}
                        onBlur={function(){ upField('variable_monto',formatearMonto(bono.variable_monto||'',lp.moneda)) }}
                        placeholder={MONEDAS_US.includes(lp.moneda)?'10,000':'10.000'}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"/>
                    </div>
                  )}
                </div>
              )
            }

            return (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bonos / Variables</label>
                  <button onClick={function(){ setLP(function(f){ return {...f,bono_activo:!f.bono_activo,...(!f.bono_activo?{}:{bono_tipo:'',bono_esquema:'',bono_pct:'',bono_num_salarios:'',bono_monto:'',variable_monto:''})} }) }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${lp.bono_activo?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>
                    {lp.bono_activo?'✓ Aplica':'+ Agregar'}
                  </button>
                </div>
                {lp.bono_activo&&(
                  <BonoCard bono={{tipo:lp.bono_tipo,esquema:lp.bono_esquema,frecuencia:lp.bono_frecuencia,pct:lp.bono_pct,num_salarios:lp.bono_num_salarios,monto:lp.bono_monto,variable_monto:lp.variable_monto}} isMain={true} idx={0}/>
                )}
                {bonosExtra.map(function(b,i){
                  return (
                    <div key={i} className="mt-2">
                      <BonoCard bono={b} isMain={false} idx={i}/>
                    </div>
                  )
                })}
                {(lp.bono_activo||bonosExtra.length>0)&&(
                  <button onClick={function(){ setLP(function(f){ return {...f, bonos_extra: [...(f.bonos_extra||[]), {tipo:'',esquema:'',frecuencia:'',pct:'',num_salarios:'',monto:'',variable_monto:''}]} }) }}
                    className="mt-2 w-full text-xs font-semibold py-2 rounded-lg border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer">
                    + Otro Bono / Variable
                  </button>
                )}
              </div>
            )
          })()}

          {/* Otros beneficios */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">
              Otros beneficios <span className="text-slate-400 font-normal">(campo libre)</span>
            </label>
            <textarea value={lp.prestaciones_otros||''} onChange={function(e){ setLP(function(f){ return {...f,prestaciones_otros:e.target.value} }) }}
              placeholder="Ej. Seguro dental, días adicionales de vacaciones, plan de carrera, acciones de la empresa..."
              rows={2} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 resize-none"/>
          </div>

          {/* ── Expectativa salarial — sección light azul ── */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-blue-100">
              <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Mi Expectativa Salarial</span>
              <span className="text-[10px] text-blue-500 font-medium">(para tu próxima posición)</span>
            </div>
            <div>
              <label className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 block">Expectativa mensual bruta</label>
              <div className="flex gap-2">
                <select value={lp.moneda||''} onChange={function(e){ setLP(function(f){ return {...f,moneda:e.target.value} }) }}
                  className="border border-blue-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 shrink-0 bg-white">
                  <option value="">Moneda</option>
                  {MONEDAS_LIST.map(function(m){ return <option key={m.code} value={m.code}>{m.code}</option> })}
                </select>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-blue-300 select-none">
                    {MONEDAS_LIST.find(function(m){ return m.code===lp.moneda })?.symbol||'$'}
                  </span>
                  <input type="text"
                    value={lp.expectativa_salarial_monto||''}
                    onChange={function(e){ setLP(function(f){ return {...f, expectativa_salarial_monto: soloNumericos(e.target.value, f.moneda)} }) }}
                    onBlur={function(){ setLP(function(f){ return {...f, expectativa_salarial_monto: formatearMonto(lp.expectativa_salarial_monto||'', f.moneda)} }) }}
                    placeholder={MONEDAS_US.includes(lp.moneda)?'70,000':'70.000'}
                    className="w-full border border-blue-200 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/40 bg-white"/>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 block">Expectativa de prestaciones</label>
              <div className="flex flex-col gap-2">
                {['Prestaciones superiores','Prestaciones similares','Abierto a prestaciones inferiores'].map(function(opt){
                  const sel = lp.expectativa_prestaciones === opt
                  return (
                    <label key={opt} className={'flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors text-sm ' + (sel ? 'bg-blue-100 border-blue-400 text-blue-800 font-medium' : 'border-blue-100 bg-white text-slate-600 hover:border-blue-300')}>
                      <input type="radio" name="expectativa_prestaciones" checked={sel} onChange={function(){ setLP(function(f){ return {...f, expectativa_prestaciones: opt} }) }} className="accent-blue-600 shrink-0"/>
                      {opt}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Salario Anualizado ── */}
          {(()=>{
            const salarioNum = parseMonto(lp.salario_monto, lp.moneda)
            if (!salarioNum) return null
            const diasVac = parseInt(lp.prestaciones_detalle['Días de vacaciones']||d.dias_vacaciones||'12')||12
            const diasAg = lp.prestaciones.includes('Aguinaldo') ? parseFloat(lp.prestaciones_detalle['Aguinaldo']||'30')||30 : 0
            const primaPct = lp.prestaciones.includes('Prima vacacional') ? parseFloat(lp.prestaciones_detalle['Prima vacacional']||'25')||25 : 0
            const valesDes = lp.prestaciones.includes('Vales de despensa') ? parseMonto(lp.prestaciones_detalle['Vales de despensa']||'', lp.moneda) : 0
            const valesGas = lp.prestaciones.includes('Vales de gasolina') ? parseMonto(lp.prestaciones_detalle['Vales de gasolina']||'', lp.moneda) : 0
            const valesOtr = lp.prestaciones.includes('Otros vales') ? parseMonto(lp.prestaciones_detalle['Otros vales']||'', lp.moneda) : 0
            const fondoMonto = parseMonto(lp.fondo_ahorro_monto||'', lp.moneda)
            const carAl = lp.prestaciones.includes('Car allowance') ? parseMonto(lp.prestaciones_detalle['Car allowance']||'', lp.moneda) : 0
            const ptu = lp.prestaciones.includes('PTU') ? parseMonto(lp.prestaciones_detalle['PTU']||'', lp.moneda) : 0
            const aguinaldoCalc = diasAg > 0 ? Math.round(salarioNum/30*diasAg) : 0
            const primaCalc = primaPct > 0 ? Math.round(salarioNum/30*diasVac*(primaPct/100)) : 0
            const bonosExtra = Array.isArray(lp.bonos_extra) ? lp.bonos_extra : []
            const todosB = [...(lp.bono_activo?[{tipo:lp.bono_tipo,esquema:lp.bono_esquema,frecuencia:lp.bono_frecuencia,pct:lp.bono_pct,num_salarios:lp.bono_num_salarios,monto:lp.bono_monto,variable_monto:lp.variable_monto}]:[]), ...bonosExtra]
            const bonosAnual = todosB.reduce(function(sum, b){
              if (b.tipo==='Variable mensual') return sum + parseMonto(b.variable_monto||'', lp.moneda)*12
              const mC={'Mensual':1,'Trimestral':3,'Semestral':6,'Anual':12}[b.frecuencia]||1
              const mA={'Mensual':12,'Trimestral':4,'Semestral':2,'Anual':1}[b.frecuencia]||1
              const c = b.esquema==='%'&&b.pct&&b.frecuencia ? salarioNum*mC*(parseFloat(b.pct)/100)
                : b.esquema==='Número de salarios'&&b.num_salarios ? parseFloat(b.num_salarios)*salarioNum : null
              return c!==null ? sum+c*mA : sum+parseMonto(b.monto||'', lp.moneda)
            }, 0)
            const lineas = [
              {label:'Salario mensual × 12', v:salarioNum*12},
              ...(aguinaldoCalc>0?[{label:'Aguinaldo',v:aguinaldoCalc}]:[]),
              ...(primaCalc>0?[{label:'Prima vacacional',v:primaCalc}]:[]),
              ...(valesDes>0?[{label:'Vales de despensa × 12',v:valesDes*12}]:[]),
              ...(valesGas>0?[{label:'Vales de gasolina × 12',v:valesGas*12}]:[]),
              ...(valesOtr>0?[{label:'Otros vales × 12',v:valesOtr*12}]:[]),
              ...(fondoMonto>0?[{label:'Fondo de ahorro',v:fondoMonto}]:[]),
              ...(carAl>0?[{label:'Car allowance × 12',v:carAl*12}]:[]),
              ...(bonosAnual>0?[{label:'Bonos / Variables',v:Math.round(bonosAnual)}]:[]),
              ...(ptu>0?[{label:'PTU',v:ptu}]:[]),
            ]
            const total = lineas.reduce(function(s,l){ return s+l.v }, 0)
            return (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4">Salario Anualizado Total</div>
                <div className="space-y-1.5 mb-4">
                  {lineas.map(function(ln, i){
                    return (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{ln.label}</span>
                        <span className="font-semibold text-slate-700">{lp.moneda} {formatearMonto(String(Math.round(ln.v)), lp.moneda)}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-emerald-200">
                  <span className="text-sm font-black text-emerald-800">Total Anual</span>
                  <span className="text-xl font-black text-emerald-700">{lp.moneda} {formatearMonto(String(Math.round(total)), lp.moneda)}</span>
                </div>
              </div>
            )
          })()}

          <button onClick={function(){ onSavePerfilLocal(lp) }} disabled={saving}
            className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all cursor-pointer disabled:opacity-60 ${justSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
            {saving ? <SpinnerGap size={16} className="animate-spin"/> : <CheckCircle size={16} weight="fill"/>}
            {justSaved ? 'Guardado' : 'Guardar y continuar'}
          </button>
        </div>
  )
}
