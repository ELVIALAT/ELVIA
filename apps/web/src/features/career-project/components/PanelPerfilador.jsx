// features/career-project/components/PanelPerfilador.jsx
// Sub-panel de PilarMiPerfil (tab Perfilador/Aspiraciones). Extraído verbatim (Fase 3 refinamiento).
import { CheckCircle, SpinnerGap } from '@phosphor-icons/react'
import {
  ANIOS_EXP, AREAS_FUNC, CIUDADES_SUGERIDAS, IDIOMAS_LIST, INDUSTRIAS_LATAM,
  NIVELES_CARGO, NIVELES_CEFR, NIVELES_EDUCACION, PAISES_LATAM, TIPOS_TRABAJO,
} from '../constants'
import HelpBadge from '../../../components/common/HelpBadge'

export default function PanelPerfilador({
  citySearch, d, data, iBtn, justSaved, lp, onChange, onSavePerfilLocal, saving,
  setCitySearch, setLP, setShowCitySugg, showCitySugg, toggleArea, toggleIdioma,
  toggleInd, toggleNC, up, updNivelIdioma,
}) {
  return (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
            <h3 className="text-sm font-black text-slate-800">Perfilador del Proyecto</h3>
            <HelpBadge id="proyecto.asp" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Nivel de cargo objetivo</h3>
                        <div className="flex flex-wrap gap-2">{NIVELES_CARGO.map(n=>{const sel=Array.isArray(d.niveles_cargo)&&d.niveles_cargo.includes(n);return iBtn(sel,n,()=>toggleNC(n))})}</div>
            {Array.isArray(d.niveles_cargo)&&d.niveles_cargo.length>0&&(()=>{
              const sel=d.niveles_cargo
              const s=sel.some(n=>/c-?level/i.test(n))?{label:'C-Level / VP',color:'bg-purple-100 text-purple-700'}
                :sel.some(n=>/director|gerente/i.test(n))?{label:'Senior (Gerente/Director)',color:'bg-blue-100 text-blue-700'}
                :sel.some(n=>/jefe|coordinador/i.test(n))?{label:'Mid-Senior (Jefe/Coordinador)',color:'bg-indigo-100 text-indigo-700'}
                :sel.some(n=>/analista|asistente|asesor/i.test(n))?{label:'Junior (Analista/Asistente)',color:'bg-emerald-100 text-emerald-700'}
                :null
              return s?<span className={`inline-block mt-2 text-xs font-bold px-2.5 py-1 rounded-full ${s.color}`}>Seniority: {s.label}</span>:null
            })()}
          </div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Área funcional objetivo</h3>
            <div className="flex flex-wrap gap-2">{AREAS_FUNC.map(a=>{const sel=Array.isArray(d.areas)&&d.areas.includes(a);return iBtn(sel,a,()=>toggleArea(a))})}</div>
            {Array.isArray(d.areas)&&d.areas.includes('Otro')&&(
              <input value={lp.area_otro||''} onChange={e=>setLP(f=>({...f, area_otro: e.target.value}))} placeholder="Especifica el área..."
                className="mt-3 w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/>)}</div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Cargo objetivo</h3>
            <p className="text-xs text-slate-400 mb-2">El título del puesto al que aplicarías — se usa para buscar vacantes relevantes.</p>
            <input
              value={d.cargo_objetivo||''}
              onChange={e=>up('cargo_objetivo', e.target.value)}
              placeholder="ej. Director General, Gerente Comercial, VP Finanzas..."
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">Tip: cargo genérico funciona mejor en búsquedas (ej. "Director General" en vez de "Director de Operaciones Lean")</p>
          </div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Industrias de interés</h3>
            <div className="flex flex-wrap gap-2">{[...INDUSTRIAS_LATAM,'Otro'].map(ind=>{const sel=Array.isArray(d.industrias_deseadas)&&d.industrias_deseadas.includes(ind);return(
              <button key={ind} onClick={()=>toggleInd(ind)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${sel?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>{ind}</button>
            )})}</div>
            {Array.isArray(d.industrias_deseadas)&&d.industrias_deseadas.includes('Otro')&&(
              <div className="mt-3 flex gap-2">
                <input value={lp.industria_otro||''} onChange={e=>setLP(f=>({...f, industria_otro: e.target.value}))} placeholder="Especifica la industria..."
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/>
                <button onClick={()=>{const val=(lp.industria_otro||'').trim();if(val){const arr=Array.isArray(d.industrias_deseadas)?d.industrias_deseadas:[]; onChange({ ...d, industrias_deseadas: [...arr.filter(x=>x!=='Otro'), val] }); setLP(f=>({...f, industria_otro: '' }))}}}
                  disabled={!lp.industria_otro||!lp.industria_otro.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">+</button>
              </div>
            )}</div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Tipo de trabajo</h3>
            <div className="flex flex-wrap gap-2">{TIPOS_TRABAJO.map(t=>(
              <button key={t} onClick={()=>up('tipo_trabajo',t)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${d.tipo_trabajo===t?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>{t}</button>
            ))}</div></div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Ciudades / Países de búsqueda</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm text-slate-600">¿Relocalización?</span>
              {['Sí','No'].map(op=>(
                <button key={op} onClick={()=>up('busca_otras_ciudades',op==='Sí')}
                  className={`px-4 py-1.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${d.busca_otras_ciudades===(op==='Sí')?'bg-slate-800 text-white border-slate-800':'border-slate-300 text-slate-600 hover:border-slate-500'}`}>{op}</button>
              ))}
            </div>
            {d.busca_otras_ciudades&&(<div>
              <p className="text-xs text-slate-500 mb-3">Ciudades y países de preferencia:</p>
              {/* Campo de búsqueda con autocompletado */}
              <div className="relative mb-3">
                <input
                  value={citySearch}
                  onChange={e=>{setCitySearch(e.target.value);setShowCitySugg(e.target.value.length>0)}}
                  onKeyDown={e=>{if(e.key==='Enter'&&citySearch.trim()){const arr=Array.isArray(d.ciudades_preferidas)?d.ciudades_preferidas:[];if(!arr.includes(citySearch.trim())){ onChange({ ...d, ciudades_preferidas: [...arr, citySearch.trim()] }) };setCitySearch('');setShowCitySugg(false)}}}
                  onBlur={()=>setTimeout(()=>setShowCitySugg(false),150)}
                  placeholder="Buscar ciudad o país..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40"/>
                {showCitySugg&&(
                  <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                    {[...PAISES_LATAM,...CIUDADES_SUGERIDAS].filter((c,i,a)=>a.indexOf(c)===i).filter(c=>c.toLowerCase().includes(citySearch.toLowerCase())).slice(0,8).map(c=>{
                      const arr=Array.isArray(d.ciudades_preferidas)?d.ciudades_preferidas:[]
                      if(arr.includes(c))return null
                      return(<button key={c} onMouseDown={()=>{ onChange({ ...d, ciudades_preferidas: [...arr, c] });setCitySearch('');setShowCitySugg(false)}} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700">{c}</button>)
                    })}
                  </div>
                )}
              </div>
              {/* Tags seleccionados */}
              {Array.isArray(d.ciudades_preferidas)&&d.ciudades_preferidas.length>0&&(
                <div className="flex flex-wrap gap-2 mb-3">
                  {d.ciudades_preferidas.map(c=>(
                    <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-700 text-white border border-slate-700">
                      {c}
                      <button onClick={()=>up('ciudades_preferidas',d.ciudades_preferidas.filter(x=>x!==c))} className="hover:text-red-300 cursor-pointer leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
              {/* Sugerencias rápidas en grid para ver todas sin scroll */}
              <p className="text-xs text-slate-400 mb-2">Sugerencias rápidas:</p>
              <div className="grid grid-cols-3 gap-1.5">{CIUDADES_SUGERIDAS.map(c=>{const arr=Array.isArray(d.ciudades_preferidas)?d.ciudades_preferidas:[];const sel=arr.includes(c);return(
                <button key={c} onClick={()=>{if(sel)up('ciudades_preferidas',arr.filter(x=>x!==c));else up('ciudades_preferidas',[...arr,c])}}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer text-center ${sel?'bg-slate-700 text-white border-slate-700':'border-slate-300 text-slate-600 hover:border-slate-500'}`}>{c}</button>
              )})}</div>
            </div>)}</div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Nivel educativo</h3>
            <div className="flex flex-wrap gap-3">{NIVELES_EDUCACION.map(n=>(
              <button key={n} onClick={()=>up('nivel_educativo',n)}
                className={`px-5 py-3 rounded-2xl text-sm font-bold border-2 transition-colors cursor-pointer ${d.nivel_educativo===n?'bg-indigo-600 text-white border-indigo-600 shadow-md':'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>{n}</button>
            ))}</div></div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Años de experiencia profesional</h3>
            <div className="flex flex-wrap gap-2">{ANIOS_EXP.map(a=>(
              <button key={a} onClick={()=>up('anios_experiencia',a)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${d.anios_experiencia===a?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>{a}</button>
            ))}</div></div>
          <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Idiomas</h3>
            <div className="flex flex-wrap gap-2 mb-3">{IDIOMAS_LIST.map(id=>{const sel=Array.isArray(d.idiomas)&&d.idiomas.find(i=>i.idioma===id);return(
              <button key={id} onClick={()=>toggleIdioma(id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ${sel?'bg-indigo-600 text-white border-indigo-600':'border-slate-300 text-slate-600 hover:border-indigo-400'}`}>{id}</button>
            )})}</div>
            {Array.isArray(d.idiomas)&&d.idiomas.length>0&&(
              <div className="space-y-2">{d.idiomas.map(i=>(
                <div key={i.idioma} className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <span className="text-sm font-semibold text-indigo-700 flex-1">{i.idioma}</span>
                  <select value={i.nivel} onChange={e=>updNivelIdioma(i.idioma,e.target.value)}
                    className="border border-indigo-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                    {NIVELES_CEFR.map(n=><option key={n} value={n}>{n}</option>)}</select>
                </div>
              ))}</div>)}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Top 5 Compañías objetivo · <span className="text-amber-600">Escribe al menos 1</span></h3>
            <p className="text-xs text-slate-400 mb-4">Estas empresas aparecerán como búsqueda dirigida en Buscar Vacantes.</p>
            <div className="space-y-2">
              {[0,1,2,3,4].map(function(i){
                const empresas = Array.isArray(d.top5empresas) ? d.top5empresas : (Array.isArray(data?.autoconocimiento?.top5empresas) ? data.autoconocimiento.top5empresas : [])
                const updateEmpresa = function(idx,val){
                  const arr = (Array.isArray(d.top5empresas)?d.top5empresas:empresas).slice()
                  while(arr.length<5) arr.push('')
                  arr[idx]=val; up('top5empresas',arr)
                }
                return(
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 text-xs font-black flex items-center justify-center shrink-0 border border-amber-200">{i+1}</span>
                    <input value={empresas[i]||''} onChange={function(e){updateEmpresa(i,e.target.value)}}
                      placeholder={'Empresa #'+(i+1)+' (ej: Google, Banorte...)'}
                      className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-400"/>
                  </div>
                )
              })}
            </div>
          </div>
          <button onClick={()=>onSavePerfilLocal(lp)} disabled={saving}
            className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all cursor-pointer disabled:opacity-60 ${justSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
            {saving ? <SpinnerGap size={16} className="animate-spin"/> : (justSaved ? <CheckCircle size={16} weight="fill"/> : <CheckCircle size={16} weight="fill"/>)}
            {justSaved ? 'Guardado' : 'Guardar Perfilador'}
          </button>
        </div>
  )
}
