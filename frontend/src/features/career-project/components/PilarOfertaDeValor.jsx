// features/career-project/components/PilarOfertaDeValor.jsx
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 3).
import { useState } from 'react'
import { Sparkle, MicrophoneStage, UsersThree, CheckFat, WarningCircle, X } from '@phosphor-icons/react'
import { supabase } from '../../../services/authService'
import HelpBadge from '../../../components/common/HelpBadge'

const CULTURA_SUGERIDAS = [
  'De puertas abiertas','Feedback continuo','Comunicación transparente',
  'Orientada a resultados','Innovación constante','Work-life balance',
  'Multinacional','Nacional','Transnacional','Startup / Ágil',
  'Diversidad e inclusión','Jerarquía plana','Mentoría y desarrollo',
  'Colaborativa','Autonomía profesional','Alta exigencia',
  'Procesos bien definidos','Con propósito social','Flexible',
]

export default function PilarOfertaDeValor({ data, onChange, onSave, justSaved, contexto }) {
  const d = data || {}
  const up = function(key, val) { onChange(Object.assign({}, d, {[key]: val})) }
  const [cultInput, setCultInput] = useState('')
  const [modalIkigai, setModalIkigai] = useState(false)
  const [modalIncompleto, setModalIncompleto] = useState(null) // null | string[]
  const [iaLoading, setIaLoading] = useState(false)
  const [iaDraft, setIaDraft] = useState(false)

  const ikigaiCompleto = ['ikigai_amas','ikigai_bueno','ikigai_necesita','ikigai_pagar'].every(function(k){ return String(d[k]||'').trim().length >= 50 })
  const tieneSkills = Array.isArray(contexto?.hard_skills) && contexto.hard_skills.length > 0

  const generarConIA = async function() {
    if (iaLoading) return
    setIaLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const { data: { session } } = await (await import('../../../services/authService')).supabase.auth.getSession()
      const res = await fetch(`${apiUrl}/api/cv/oferta-valor-ia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          ikigai_amas:     d.ikigai_amas || '',
          ikigai_bueno:    d.ikigai_bueno || '',
          ikigai_necesita: d.ikigai_necesita || '',
          ikigai_pagar:    d.ikigai_pagar || '',
          hard_skills:     contexto?.hard_skills || [],
          soft_skills:     contexto?.soft_skills || [],
          niveles_cargo:   contexto?.niveles_cargo || [],
          areas:           contexto?.areas || [],
          cultura:         Array.isArray(d.cultura) ? d.cultura : [],
        }),
      })
      const json = await res.json()
      if (json.oferta_valor) {
        up('oferta_valor', json.oferta_valor)
        setIaDraft(true)
      }
    } catch (e) {
      console.error('generarConIA:', e)
    } finally {
      setIaLoading(false)
    }
  }

  const IKIGAI_LABELS = {
    ikigai_amas:     '¿Qué es lo que AMAS?',
    ikigai_bueno:    '¿Para qué eres BUENO/A?',
    ikigai_necesita: '¿Qué NECESITA el mundo de ti?',
    ikigai_pagar:    '¿Por qué podrían PAGARTE?',
  }

  function getIncompletos() {
    const items = []
    if (String(d.oferta_valor||'').trim().length < 20) items.push('Tu oferta de valor (mínimo 20 caracteres)')
    Object.keys(IKIGAI_LABELS).forEach(function(k) {
      if (String(d[k]||'').trim().length < 50) items.push(IKIGAI_LABELS[k] + ' (mínimo 50 caracteres)')
    })
    return items
  }

  function handleSave() {
    const faltantes = getIncompletos()
    if (faltantes.length > 0) {
      setModalIncompleto(faltantes)
    } else {
      onSave(d)
    }
  }

  const cultura = Array.isArray(d.cultura) ? d.cultura : []

  const toggleCultura = function(tag) {
    if (cultura.includes(tag)) {
      up('cultura', cultura.filter(function(t){ return t !== tag }))
    } else {
      up('cultura', cultura.concat([tag]))
    }
  }

  const addCustom = function() {
    const val = cultInput.trim()
    if (!val || cultura.includes(val)) { setCultInput(''); return }
    up('cultura', cultura.concat([val]))
    setCultInput('')
  }

  const customTags = cultura.filter(function(t){ return !CULTURA_SUGERIDAS.includes(t) })

  return (
    <div className="space-y-8">

      {/* ── Cultura ── */}
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100">
        <div className="flex items-center gap-2 mb-1">
          <UsersThree size={16} className="text-rose-600" weight="duotone"/>
          <h3 className="font-bold text-slate-800">¿Qué cultura laboral te define?</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Selecciona o agrega los valores y dinámicas de trabajo que mejor se alinean con tu perfil.
          Pueden ser tipo de empresa (multinacional, startup) o estilo de trabajo (feedback continuo, jerarquía plana).
        </p>

        {/* Sugerencias */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CULTURA_SUGERIDAS.map(function(tag){
            const sel = cultura.includes(tag)
            return (
              <button key={tag} onClick={function(){ toggleCultura(tag) }}
                className={'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer ' +
                  (sel ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-200 text-slate-600 hover:border-rose-400 hover:text-rose-700')}>
                {tag}
              </button>
            )
          })}
        </div>

        {/* Tags personalizados */}
        {customTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {customTags.map(function(tag){
              return (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-rose-600 text-white border border-rose-600">
                  {tag}
                  <button onClick={function(){ up('cultura', cultura.filter(function(t){ return t !== tag })) }}
                    className="opacity-70 hover:opacity-100 cursor-pointer leading-none">×</button>
                </span>
              )
            })}
          </div>
        )}

        {/* Agregar personalizado */}
        <div className="flex gap-2">
          <input
            value={cultInput}
            onChange={function(e){ setCultInput(e.target.value) }}
            onKeyDown={function(e){ if (e.key==='Enter'){ e.preventDefault(); addCustom() } }}
            placeholder="Agrega tu propio valor cultural..."
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white"
          />
          <button onClick={addCustom}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap">
            + Agregar
          </button>
        </div>
      </div>

      {/* ── IKIGAI · 4 cajas obligatorias ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-50 via-white to-rose-50 border border-violet-100 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkle size={16} className="text-violet-600" weight="duotone"/>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Descubre tu IKIGAI profesional
              <HelpBadge id="proyecto.ikigai" />
            </h3>
            <button
              onClick={function(){ setModalIkigai(true) }}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-violet-600 bg-violet-100 hover:bg-violet-200 px-3 py-1 rounded-full transition-colors cursor-pointer shrink-0"
            >
              <Sparkle size={12} weight="fill"/> ¿Qué es el IKIGAI?
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Las 4 preguntas del método IKIGAI japonés para encontrar el propósito en tu carrera.
            Tómate tu tiempo — esta reflexión es la base de tu oferta de valor.
          </p>

          {/* ── Modal IKIGAI ── */}
          {modalIkigai && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{backgroundColor:'rgba(15,10,40,0.6)', backdropFilter:'blur(4px)'}}
              onClick={function(e){ if(e.target===e.currentTarget) setModalIkigai(false) }}
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-600 to-rose-500 rounded-t-3xl shrink-0">
                  <Sparkle size={22} className="text-white" weight="fill"/>
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-lg leading-tight">El método IKIGAI</h2>
                    <p className="text-violet-100 text-xs">Tu razón de ser profesional</p>
                  </div>
                  <button
                    onClick={function(){ setModalIkigai(false) }}
                    className="text-white/80 hover:text-white transition-colors p-1 cursor-pointer"
                  >
                    <X size={20} weight="bold"/>
                  </button>
                </div>

                {/* Body — scrollable */}
                <div className="overflow-y-auto px-6 py-5 space-y-5 text-sm text-slate-700">

                  <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
                    <p className="font-semibold text-violet-800 mb-1">¿Qué es el IKIGAI?</p>
                    <p className="text-slate-600 leading-relaxed">
                      Ikigai (生き甲斐) es un concepto japonés que significa <em>"razón de ser"</em> o <em>"razón para levantarte en la mañana"</em>.
                      Es la intersección entre lo que amas, lo que se te da bien, lo que el mundo necesita y por lo que te pueden pagar.
                      Cuando alineas estas cuatro fuerzas, encuentras un trabajo que no se siente como trabajo.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold text-slate-800 mb-2">¿Cómo funciona?</p>
                    <p className="text-slate-600 leading-relaxed">
                      El IKIGAI se construye respondiendo honestamente cuatro preguntas. La magia ocurre en las intersecciones:
                    </p>
                    <ul className="mt-3 space-y-2 pl-2">
                      <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span><span><strong className="text-rose-700">PASIÓN</strong> = lo que amas + lo que haces bien</span></li>
                      <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span><span><strong className="text-blue-700">MISIÓN</strong> = lo que amas + lo que el mundo necesita</span></li>
                      <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span><span><strong className="text-emerald-700">VOCACIÓN</strong> = lo que haces bien + por lo que te pagan</span></li>
                      <li className="flex gap-2"><span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">4</span><span><strong className="text-amber-700">PROFESIÓN</strong> = lo que el mundo necesita + por lo que te pagan</span></li>
                    </ul>
                  </div>

                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                    <p className="font-semibold text-rose-700 mb-1">¿Qué es lo que AMAS?</p>
                    <p className="text-slate-600 leading-relaxed">
                      La primera parte del IKIGAI descubrirá el tipo de actividades que hacen latir tu corazón.
                      No sobrepienses — elige tu primer instinto. Piensa en qué harías aunque no te pagaran,
                      qué temas investigas en tu tiempo libre, qué conversaciones te emocionan sin que nadie te lo pida.
                    </p>
                    <p className="mt-2 text-xs text-rose-600 font-medium italic">
                      "¿Qué actividades haces sin que te importe el paso del tiempo? ¿Qué temas investigarías gratis?"
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="font-semibold text-blue-700 mb-1">¿Para qué eres BUENO?</p>
                    <p className="text-slate-600 leading-relaxed">
                      Esta sección busca tus mejores aptitudes — incluso si no disfrutas usarlas. Ten la mente abierta.
                      Piensa en los elogios que recibes con frecuencia, en qué tareas eres más eficiente que el promedio,
                      o qué cosas otros te piden ayuda porque saben que lo haces bien.
                    </p>
                    <p className="mt-2 text-xs text-blue-600 font-medium italic">
                      "¿Qué elogios recibes de tus colegas? ¿En qué eres más eficiente que el promedio?"
                    </p>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                    <p className="font-semibold text-emerald-700 mb-1">¿Qué es lo que el mundo NECESITA de ti?</p>
                    <p className="text-slate-600 leading-relaxed">
                      Esta sección se enfoca en el impacto que puedes tener. Con la educación y experiencia adecuadas,
                      puedes hacer todo lo que te propongas para ayudar a tu industria, empresa o comunidad.
                      Piensa en problemas que nadie está resolviendo, en brechas que ves y que tú podrías cerrar.
                    </p>
                    <p className="mt-2 text-xs text-emerald-600 font-medium italic">
                      "¿Qué problemas ves en tu industria que nadie resuelve? ¿Qué carencia podrías cubrir?"
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <p className="font-semibold text-amber-700 mb-1">¿Por qué podrían PAGARTE?</p>
                    <p className="text-slate-600 leading-relaxed">
                      Esta sección identifica qué habilidades tuyas son valiosas en el mercado laboral hoy.
                      ¿Qué combinación de skills tienes que sea escasa? ¿Qué servicios o conocimientos buscan
                      las empresas y que tú puedes ofrecer con credibilidad y resultados probados?
                    </p>
                    <p className="mt-2 text-xs text-amber-600 font-medium italic">
                      "¿Qué conocimientos están contratando hoy las empresas donde tú puedes generar valor?"
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-violet-50 to-rose-50 border border-violet-100 rounded-2xl p-4">
                    <p className="font-semibold text-violet-800 mb-2">Tu IKIGAI en la búsqueda de empleo</p>
                    <p className="text-slate-600 leading-relaxed">
                      Completar estas 4 reflexiones tiene un impacto directo en tu proceso:
                    </p>
                    <ul className="mt-2 space-y-1 text-slate-600">
                      <li className="flex gap-2"><span className="text-violet-500 font-bold">→</span> Defines con precisión qué tipo de empresa y cultura buscas</li>
                      <li className="flex gap-2"><span className="text-violet-500 font-bold">→</span> Articulas tu propuesta de valor en entrevistas con claridad</li>
                      <li className="flex gap-2"><span className="text-violet-500 font-bold">→</span> Filtras oportunidades que no van alineadas con tu propósito</li>
                      <li className="flex gap-2"><span className="text-violet-500 font-bold">→</span> Tu "Elevator Pitch" se vuelve auténtico y memorable</li>
                    </ul>
                  </div>

                  <p className="text-center text-xs text-slate-400 pb-2">
                    Metodología basada en el concepto IKIGAI japonés adaptada para la búsqueda laboral estratégica por ELVIA®
                  </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
                  <button
                    onClick={function(){ setModalIkigai(false) }}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Entendido, ¡voy a completarlo!
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {[
          {
            key: 'ikigai_amas',
            title: '¿Qué es lo que AMAS?',
            color: 'rose',
            desc: 'La primera parte de IKIGAI descubrirá el tipo de actividades que hacen latir tu corazón y el tipo de actividades que no te gustan. No sobrepienses, solo elige tu primer instinto.',
            ej: '¿Qué actividades haces sin que te importe el paso del tiempo? ¿Qué temas investigarías gratis?',
            placeholder: 'Me apasiona enseñar y ver cómo otros crecen. Investigo de innovación y modelos de negocio sin que nadie me lo pida...',
          },
          {
            key: 'ikigai_bueno',
            title: '¿Para qué eres BUENO?',
            color: 'blue',
            desc: 'En esta sección descubrirás para qué eres bueno. Esta parte del IKIGAI buscará tus mejores aptitudes, incluso si en realidad no disfrutas usarlas, así que ten la mente abierta al contestar.',
            ej: '¿Qué elogios recibes con frecuencia de tus colegas o jefes? ¿En qué tareas eres más eficiente que el promedio?',
            placeholder: 'Mis colegas dicen que explico ideas complejas de forma simple. Soy rápida estructurando información en presentaciones...',
          },
          {
            key: 'ikigai_necesita',
            title: '¿Qué es lo que el mundo NECESITA de ti?',
            color: 'emerald',
            desc: 'Esta sección se enfoca en el conocimiento que tienes o te gustaría tener. Después de todo, con la educación adecuada puedes hacer todo lo que te propongas para ayudar al mundo.',
            ej: '¿Qué problemas ves en tu comunidad o en tu industria que nadie está resolviendo?',
            placeholder: 'En mi industria muchas empresas no usan datos para tomar decisiones. Veo el problema de que los equipos juniors no tienen mentoría real...',
          },
          {
            key: 'ikigai_pagar',
            title: '¿Por qué podrían PAGARTE?',
            color: 'amber',
            desc: 'Esta sección se enfoca en entender qué habilidades son necesarias en el mercado laboral y que son tu diferenciador.',
            ej: '¿Qué servicios o conocimientos están contratando hoy en día las empresas en los que tú puedes generar valor?',
            placeholder: 'Las empresas hoy buscan profesionales que combinen análisis de datos con storytelling. Mi mezcla de Marketing + SQL + presentación a C-level es escasa...',
          },
        ].map(function(it){
          const val = String(d[it.key]||'')
          const ok = val.trim().length >= 50
          const colorMap = {
            rose:    { ring:'border-rose-200 bg-rose-50/40',    badge:'bg-rose-500',    text:'text-rose-700',    ringFocus:'focus:ring-rose-200' },
            blue:    { ring:'border-blue-200 bg-blue-50/40',    badge:'bg-blue-500',    text:'text-blue-700',    ringFocus:'focus:ring-blue-200' },
            emerald: { ring:'border-emerald-200 bg-emerald-50/40', badge:'bg-emerald-500', text:'text-emerald-700', ringFocus:'focus:ring-emerald-200' },
            amber:   { ring:'border-amber-200 bg-amber-50/40',  badge:'bg-amber-500',   text:'text-amber-700',   ringFocus:'focus:ring-amber-200' },
          }
          const c = colorMap[it.color]
          return (
            <div key={it.key} className={'p-4 rounded-xl border-2 transition-all '+c.ring}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className={'w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0 '+c.badge}>★</span>
                  <h4 className={'font-bold text-sm '+c.text}>
                    {it.title} <span className="text-red-500">*</span>
                  </h4>
                </div>
                {ok ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                    <CheckFat size={10} weight="fill"/> Completo
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-slate-500 bg-white/70 px-2 py-0.5 rounded-full shrink-0">Obligatorio</span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-1">{it.desc}</p>
              <p className="text-xs text-slate-500 italic mb-3"><strong>Ej:</strong> {it.ej}</p>
              <textarea
                value={val}
                onChange={function(e){ up(it.key, e.target.value) }}
                placeholder={it.placeholder}
                rows={3}
                className={'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 resize-none '+c.ringFocus}
              />
              <div className="flex justify-end mt-1">
                <span className={'text-[10px] font-semibold '+(ok ? 'text-emerald-600' : 'text-slate-400')}>
                  {val.trim().length}/50 mínimo
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Oferta de valor ── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <MicrophoneStage size={16} className="text-rose-600" weight="duotone"/>
          <h3 className="font-bold text-slate-800">¿Cuál es tu oferta de valor? <span className="text-red-500">*</span></h3>
          {String(d.oferta_valor||'').trim().length >= 20 ? (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
              <CheckFat size={10} weight="fill"/> Completo
            </span>
          ) : (
            <span className="ml-auto text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">Obligatorio</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-1">
          Si tuvieras 5 minutos en una charla TED, ¿cómo le explicarías a una empresa exactamente
          qué valor único traes con tu experiencia, habilidades y forma de trabajar?
        </p>
        <p className="text-xs text-rose-600 font-semibold mb-3">
          Este texto se integrará en tu CV optimizado, después de tus datos de contacto.
        </p>
        <div className="flex items-center justify-between gap-3 mb-3">
          {iaDraft && (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-violet-700 bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-full">
              <Sparkle size={10} weight="fill"/> Borrador generado por ELVIA® — edítalo a tu gusto
            </span>
          )}
          <button
            onClick={generarConIA}
            disabled={iaLoading || !ikigaiCompleto || !tieneSkills}
            title={!ikigaiCompleto ? 'Completa las 4 preguntas IKIGAI primero' : !tieneSkills ? 'Agrega al menos 1 Hard Skill en Competencias' : ''}
            className={'ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border ' +
              (iaLoading || !ikigaiCompleto || !tieneSkills
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600 shadow-sm hover:shadow-md')}
          >
            {iaLoading ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Generando…</>
            ) : (
              <><Sparkle size={14} weight="fill"/> Generar borrador con ELVIA®</>
            )}
          </button>
        </div>
        <textarea
          value={d.oferta_valor || ''}
          onChange={function(e){ up('oferta_valor', e.target.value); if(iaDraft) setIaDraft(false) }}
          placeholder={'Ej: Soy un profesional de Supply Chain con 12 años de experiencia en manufactura automotriz. Mi valor está en reducir costos operativos sin sacrificar calidad: en mis últimos 3 roles, lideré proyectos que redujeron tiempos de entrega en un 30% y costos logísticos en un 18%. Combino análisis de datos con liderazgo de equipos multiculturales y me adapto rápido a entornos de alta presión. Lo que me diferencia es mi capacidad de conectar la estrategia de negocio con la operación del día a día.'}
          rows={8}
          maxLength={700}
          className={'w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none bg-white '+(String(d.oferta_valor||'').trim().length>=20?'border-emerald-300 focus:ring-emerald-200':'border-rose-200 focus:ring-rose-200')}
        />
        <div className="flex justify-between mt-1.5">
          <span className={'text-xs font-semibold '+(String(d.oferta_valor||'').trim().length>=20?'text-emerald-600':'text-slate-400')}>
            {String(d.oferta_valor||'').trim().length < 20 && `Mínimo 20 caracteres (${String(d.oferta_valor||'').trim().length}/20)`}
          </span>
          <span className="text-xs text-slate-400">{(d.oferta_valor||'').length}/700 caracteres</span>
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${justSaved?'bg-emerald-600 text-white':'bg-rose-600 hover:bg-rose-700 text-white'}`}>
          {justSaved ? (<><CheckFat size={16} weight="fill"/> Guardado</>) : 'Guardar'}
        </button>
      </div>

      {/* ── Modal: sección incompleta ── */}
      {modalIncompleto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor:'rgba(15,10,40,0.55)', backdropFilter:'blur(4px)'}}
          onClick={function(e){ if(e.target===e.currentTarget) setModalIncompleto(null) }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-500 to-rose-600 rounded-t-3xl flex items-center gap-3">
              <WarningCircle size={24} className="text-white" weight="fill"/>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">Sección incompleta</h2>
                <p className="text-rose-100 text-xs mt-0.5">Completa estos campos para guardar tu progreso</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">
                Para guardar correctamente y reflejar tu progreso, necesitas completar:
              </p>
              <ul className="space-y-2 mb-6">
                {modalIncompleto.map(function(item, i){
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">!</span>
                      {item}
                    </li>
                  )
                })}
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={function(){ setModalIncompleto(null) }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-colors cursor-pointer"
                >
                  Volver a completar
                </button>
                <button
                  onClick={function(){ setModalIncompleto(null); onSave(d) }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
                >
                  Guardar así
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
