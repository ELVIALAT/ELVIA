// features/linkedin/components/FormView.jsx
// Vista del formulario: modal de reemplazo, historial, header, avisos, selector de modo
// (PDF / manual), zona de carga y formulario de secciones con contador de uso.
// Extraído verbatim desde pages/LinkedinPro.jsx (Fase 3); es el return por defecto del
// componente original (cuando no hay resultado).
import {
  LinkedinLogo, Sparkle, WarningCircle, CaretDown, CaretUp, ArrowRight,
  Clock, FilePdf, NotePencil, UploadSimple, CircleNotch, CheckCircle,
} from '@phosphor-icons/react'
import HelpBadge from '../../../components/common/HelpBadge'
import { SECCIONES } from '../constants'
import { colorPuntaje } from '../helpers'
import { useLinkedinCtx } from '../LinkedinContext'

const PI = {
  FilePdf, NotePencil, UploadSimple,
  CircleNotch, Sparkle, CheckCircle, WarningCircle, ArrowRight,
}

export default function FormView() {
  const {
    modalReemplazar, setModalReemplazar, analisisPrevio, handleLanzarAnalisis,
    historial, historialAbierto, setHistorialAbierto, setResultado,
    setOriginalSnapshot, setEditables, jpData, navigate, importMode, setImportMode,
    handlePDFUpload, isExtracting, error, campos, setCampos, handleSubmit,
    usoMes, camposLlenos, cargando, user,
  } = useLinkedinCtx()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Modal: confirmar reemplazo del análisis anterior */}
      {modalReemplazar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                <WarningCircle size={32} weight="duotone" className="text-amber-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Ya tienes un análisis guardado</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tu análisis del{' '}
                <strong>{new Date(analisisPrevio?.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>{' '}
                será reemplazado por este nuevo. Esta acción usará uno de tus análisis del mes.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModalReemplazar(false)}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleLanzarAnalisis}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#0077B5] to-[#019DF4] text-white text-sm font-black uppercase tracking-wider hover:brightness-110 transition-all"
              >
                Sí, reemplazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de análisis */}
      {historial.length > 0 && (
        <div className="mb-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <button
            onClick={() => setHistorialAbierto(h => !h)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Clock size={18} weight="duotone" className="text-[#0077B5]" />
              <div>
                <p className="text-sm font-bold text-slate-800">Historial de análisis</p>
                <p className="text-xs text-slate-400">{historial.length} análisis guardado{historial.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {historialAbierto ? <CaretUp size={16} className="text-slate-400" /> : <CaretDown size={16} className="text-slate-400" />}
          </button>
          {historialAbierto && (
            <div className="border-t border-slate-100 divide-y divide-slate-50">
              {historial.map((entry) => {
                const color = colorPuntaje(entry.puntaje_global)
                const fecha = new Date(entry.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
                const campos = Array.isArray(entry.campos_analizados) ? entry.campos_analizados.join(', ') : ''
                return (
                  <div key={entry.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-full border-2 ${color.border} ${color.bg} shrink-0`}>
                      <span className={`text-sm font-black ${color.text}`}>{entry.puntaje_global}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${color.labelBg} ${color.labelText}`}>{color.label}</span>
                        <span className="text-xs text-slate-400">{fecha}</span>
                      </div>
                      {campos && <p className="text-[11px] text-slate-400 mt-0.5 truncate capitalize">{campos}</p>}
                    </div>
                    <button
                      onClick={() => {
                        setResultado(entry)
                        // Para análisis del historial no tenemos snapshot del texto original ni sugerencias_aplicables.
                        // Caemos al "ejemplo" del análisis IA — el usuario aún puede editar y copiar.
                        const secs = entry.secciones || {}
                        const habilidadesIniciales = String(secs.habilidades?.ejemplo || '')
                          .split(/[,\n;]+/).map(s => s.trim()).filter(Boolean)
                        setOriginalSnapshot({ titular: '', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' })
                        setEditables({
                          titular:     secs.titular?.ejemplo     || '',
                          extracto:    secs.extracto?.ejemplo    || '',
                          experiencia: secs.experiencia?.ejemplo || '',
                          habilidades: habilidadesIniciales,
                          idiomas:     secs.idiomas?.ejemplo     || '',
                          educacion:   secs.educacion?.ejemplo   || '',
                        })
                        setHistorialAbierto(false)
                      }}
                      className="shrink-0 text-xs font-bold text-[#0077B5] border border-[#0077B5]/20 hover:bg-[#0077B5]/5 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
                    >
                      Ver <ArrowRight size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0077B5]/10 flex items-center justify-center border border-[#0077B5]/20">
            <LinkedinLogo size={40} weight="fill" className="text-[#0077B5]" />
          </div>
        </div>

        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          LinkedIn<span className="text-[#0077B5]">®</span> Óptimo
        </h1>

        <div className="flex flex-col items-center gap-3">
          <div className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">
              Sintonización de Perfil con IA Elite · 2026
            </p>
          </div>
          <p className="text-sm text-slate-500 max-w-lg leading-relaxed font-medium">
            Transforma tu perfil en un imán de oportunidades. Analizamos tu contenido contra estándares de reclutadores expertos para que destaques en el mercado.
          </p>

          {/* Disclaimer Mandatory */}
          <div className="mt-4 px-5 py-2 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2">
            <Sparkle size={14} weight="fill" className="text-amber-500" />
            <p className="text-[10px] font-bold text-slate-600 italic">
              Construido y optimizado por mentores de carrera expertos y tecnología de última generación.
            </p>
          </div>
        </div>
      </div>

      {/* Avisos contextuales de perfil */}
      {(() => {
        const avisos = []
        const oferta = String(jpData?.oferta?.oferta_valor || '').trim()
        const hard = jpData?.autoconocimiento?.hard_skills || []
        const soft = jpData?.autoconocimiento?.soft_skills || []
        if (!oferta) avisos.push('Completa tu Oferta de Valor en el Gerente de Proyecto — enriquece el análisis con tu propuesta de valor única.')
        if (hard.length < 2 || soft.length < 2) avisos.push('Agrega al menos 2 Hard Skills y 2 Power Skills para que el análisis identifique mejor las brechas de tu perfil.')
        if (!avisos.length) return null
        return (
          <div className="space-y-2 mb-6">
            {avisos.map((msg, i) => (
              <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>{msg} <button onClick={() => navigate('/proyecto-laboral')} className="underline font-semibold ml-0.5">Ir al Gerente de Proyecto →</button></span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Selector de Modo */}
      <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl mb-10 border border-slate-200 shadow-sm transition-all">
        {[
          { id: 'pdf', label: 'Carga PDF', icon: PI.FilePdf },
          { id: 'manual', label: 'Manual', icon: PI.NotePencil },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setImportMode(m.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
              importMode === m.id
                ? 'bg-white text-indigo-600 shadow-md border border-slate-100 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
            }`}
          >
            <m.icon size={16} weight={importMode === m.id ? 'fill' : 'bold'} />
            {m.label}
          </button>
        ))}
      </div>

      {/* MODOS DE CARGA */}
      <div className="mb-10 min-h-[300px]">
        {importMode === 'pdf' && (
          <div className="space-y-6">
            {/* Instrucciones paso a paso */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em] mb-4">
                Cómo descargar TU perfil en PDF
              </p>
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[11px] shrink-0">1</span>
                  Entra a <strong>tu perfil principal</strong> en LinkedIn (no a otro perfil).
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[11px] shrink-0">2</span>
                  Haz clic en el botón <strong>"Recursos"</strong> (o "Más", según el idioma).
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[11px] shrink-0">3</span>
                  Selecciona <strong>"Guardar en PDF"</strong> y descarga el archivo.
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[11px] shrink-0">4</span>
                  Súbelo aquí — ELVIA valida que el perfil sea tuyo y analiza el contenido.
                </li>
              </ol>
            </div>

            {/* Zona de carga */}
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-12 text-center hover:border-indigo-500/50 transition-all group relative overflow-hidden shadow-xl shadow-slate-200/40">
              <div className="relative z-10">
                <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                  <PI.UploadSimple size={36} className="text-indigo-600" weight="duotone" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 italic">Importación Express de PDF</h3>
                <p className="text-sm text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
                  Súbelo aquí y ELVIA hará el resto.
                </p>

                <input
                  type="file"
                  accept=".pdf"
                  onChange={e => handlePDFUpload(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                  disabled={isExtracting}
                />

                {isExtracting ? (
                  <div className="flex flex-col items-center gap-4">
                     <div className="w-12 h-12 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin" />
                     <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Decodificando Perfil...</p>
                  </div>
                ) : (
                  <button className="px-10 py-4 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.25em] rounded-2xl shadow-2xl shadow-indigo-900/30 group-hover:bg-indigo-500 group-hover:-translate-y-1 transition-all duration-300">
                    Seleccionar archivo PDF
                  </button>
                )}
              </div>
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            {/* Panel de error visible en modo PDF (validación de identidad o lectura) */}
            {error && (
              <div className="flex items-start gap-4 bg-rose-50 border border-rose-200 rounded-[2rem] px-6 py-5 shadow-inner">
                <PI.WarningCircle size={24} className="text-rose-500 shrink-0" weight="fill" />
                <div>
                  <h4 className="text-[11px] font-black text-rose-800 uppercase tracking-widest mb-1">No pudimos procesar el PDF</h4>
                  <p className="text-sm font-medium text-rose-700 leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {importMode === 'manual' && (
          <div className="space-y-8 animate-slide-up">
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-3xl p-5 flex items-center justify-between backdrop-blur-sm">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <PI.CheckCircle size={18} className="text-white" weight="bold" />
                 </div>
                 <p className="text-[11px] font-black text-emerald-800 uppercase tracking-tight italic">Revisa y Analiza tu Perfil</p>
               </div>
               <button
                onClick={() => setImportMode('pdf')}
                className="px-4 py-2 bg-white rounded-xl text-[9px] font-black uppercase text-slate-600 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm"
               >
                 Cambiar modo
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {SECCIONES.map(sec => (
                <div key={sec.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/20 hover:shadow-indigo-500/5 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                      <label className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic flex items-center gap-2">
                        {sec.label}
                        <HelpBadge id={`linkedin.${sec.id}`} />
                      </label>
                    </div>
                    <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        {campos[sec.id]?.length || 0} / {sec.maxLength}
                      </span>
                    </div>
                  </div>
                  <textarea
                    value={campos[sec.id]}
                    onChange={e => setCampos(prev => ({ ...prev, [sec.id]: e.target.value }))}
                    placeholder={sec.placeholder}
                    rows={sec.rows}
                    maxLength={sec.maxLength}
                    className="w-full resize-none rounded-2xl border-none bg-slate-50/50 group-focus-within:bg-white px-6 py-5 text-sm text-slate-800
                               placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all leading-relaxed shadow-inner"
                  />
                  <p className="mt-3 text-[10px] text-slate-400 font-medium px-1 italic">{sec.descripcion}</p>
                </div>
              ))}

              {error && (
                <div className="flex items-start gap-4 bg-rose-50 border border-rose-200 rounded-[2rem] px-6 py-5 shadow-inner">
                  <PI.WarningCircle size={24} className="text-rose-500 shrink-0" weight="fill" />
                  <div>
                    <h4 className="text-[11px] font-black text-rose-800 uppercase tracking-widest mb-1">Error de Proceso</h4>
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-tight leading-relaxed">{error}</p>
                  </div>
                </div>
              )}

              {/* Contador de análisis del mes */}
              <div className={`space-y-2 px-5 py-4 rounded-2xl border ${usoMes.restantes <= 1 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'} mt-8`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkle size={16} weight="fill" className={usoMes.restantes <= 1 ? 'text-amber-500' : 'text-indigo-500'} />
                    <span className="text-xs font-bold text-slate-700">
                      Análisis restantes este mes: <span className={`font-black ${usoMes.restantes === 0 ? 'text-rose-600' : usoMes.restantes <= 1 ? 'text-amber-700' : 'text-indigo-700'}`}>{usoMes.restantes} / {usoMes.limite}</span>
                    </span>
                  </div>
                  {usoMes.restantes === 0 && usoMes.fecha_reset ? (
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                      Se reinicia el {new Date(usoMes.fecha_reset).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Es recomendable hacer cada vez menos cambios, y que sean cambios menores — los cambios bruscos en el perfil pueden confundir al mercado.
                </p>
              </div>

              <button
                type="submit"
                disabled={!camposLlenos || cargando || usoMes.restantes === 0}
                className="w-full flex items-center justify-center gap-4 py-5 rounded-[2rem]
                           bg-gradient-to-r from-[#0077B5] to-[#00a0dc] text-white font-black text-xs uppercase tracking-[0.35em] shadow-2xl shadow-indigo-900/30
                           hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all active:scale-[0.97] mt-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {cargando ? (
                  <>
                    <PI.CircleNotch size={20} className="animate-spin" />
                    Ejecutando Análisis Maestro...
                  </>
                ) : usoMes.restantes === 0 ? (
                  <>
                    <PI.WarningCircle size={20} weight="fill" />
                    Límite mensual alcanzado
                  </>
                ) : (
                  <>
                    <PI.Sparkle size={20} weight="fill" />
                    Lanzar Inteligencia Optima
                    <PI.ArrowRight size={18} weight="bold" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {!user && importMode === 'manual' && (
        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic opacity-60">
          Inicia sesión para guardar tu análisis y comparar versiones
        </p>
      )}
    </div>
  )
}
