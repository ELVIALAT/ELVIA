// features/career-project/components/PilarAutoconocimiento.jsx
// Extraído verbatim desde pages/ProyectoLaboral.jsx (Fase 3, paso 3).
import { useState } from 'react'
import { Brain, Toolbox, Heart, Kanban, CheckFat, WarningCircle } from '@phosphor-icons/react'
import SkillsAccordionPicker from './SkillsAccordionPicker'

export default function PilarAutoconocimiento({ data, onChange, onSave, justSaved }) {
  const d = data || {}
  const up = function(key, val) { onChange(Object.assign({}, d, {[key]:val})) }
  const [modalIncompleto, setModalIncompleto] = useState(null)

  function getIncompletos() {
    const items = []
    if (!Array.isArray(d.hard_skills)||d.hard_skills.length<2)   items.push('Hard Skills — selecciona al menos 2')
    if (!Array.isArray(d.soft_skills)||d.soft_skills.length<2)   items.push('Power Skills — selecciona al menos 2')
    return items
  }
  function handleSave() {
    const f = getIncompletos()
    if (f.length>0) { setModalIncompleto(f) } else { onSave(d) }
  }

  // ─── Catálogos de skills categorizados (LinkedIn Top-50 2026 + nuestro inventario fusionado) ───
  // BD sigue guardando arrays planos `hard_skills` y `soft_skills` (el campo soft_skills mantiene
  // su nombre histórico aunque la UI muestre "Power Skills" — decisión documentada en memoria).
  const HARD_SKILLS_CATEGORIAS = {
    'IA y Tecnología': [
      'Inteligencia Artificial, Machine Learning e Ingeniería de Prompts',
      'Computación en la nube (Cloud Computing)',
      'Ciberseguridad',
      'Desarrollo de software / SaaS',
      'Automatización de procesos',
      'Tecnología Blockchain y contratos inteligentes',
      'Plataformas Low-Code / No-Code',
      'Diseño UX/UI y arquitectura de la información',
      'Realidad Aumentada, Realidad Virtual y computación espacial',
    ],
    'Datos y Operaciones': [
      'Ciencia de datos e ingeniería de datos',
      'Análisis de datos (Data Analytics)',
      'Alfabetización de datos (Data Literacy)',
      'Optimización de procesos',
      'KPIs y métricas de negocio',
    ],
    'Gestión y Finanzas': [
      'Gestión de proyectos (Agile, Scrum, Kanban, PRINCE2)',
      'Gestión de riesgos y compliance',
      'Análisis financiero y contabilidad',
      'Gestión de presupuestos',
      'Modelado financiero y gestión de inversiones',
      'Ciencias actuariales y análisis crediticio',
      'Sostenibilidad, reportes ESG y "Green Skills"',
    ],
    'Ventas y Marketing': [
      'Estrategia Go-to-Market y venta consultiva',
      'Marketing digital (SEO, SEM, email)',
      'Estrategia de redes sociales y contenido digital',
      'CRM (Salesforce / HubSpot)',
      'Customer Success',
    ],
    'Industrias y Operación': [
      'Recursos Humanos: reclutamiento, compensación, cultura',
      'Ciencias de la salud y productos médicos',
      'Logística y cadena de suministro',
    ],
  }
  const POWER_SKILLS_CATEGORIAS = {
    'Carácter y Mentalidad': [
      'Adaptabilidad y flexibilidad',
      'Resiliencia y gestión del estrés',
      'Aprendizaje continuo y curiosidad',
      'Inteligencia emocional',
      'Motivación y autoconciencia',
    ],
    'Pensamiento': [
      'Pensamiento crítico y analítico',
      'Pensamiento creativo',
      'Pensamiento estratégico',
      'Pensamiento sistémico',
      'Resolución de problemas complejos',
      'Toma de decisiones basada en evidencia',
    ],
    'Comunicación e Interacción': [
      'Comunicación asertiva',
      'Hablar en público y presentaciones',
      'Empatía y escucha activa',
      'Negociación',
      'Resolución de conflictos',
      'Influencia social',
    ],
    'Liderazgo y Equipos': [
      'Liderazgo de equipos',
      'Mentoría y desarrollo de talento',
      'Gestión de stakeholders',
      'Gestión del cambio organizativo',
      'Trabajo en equipo y colaboración transversal',
    ],
    'Productividad': [
      'Gestión del tiempo',
      'Servicio y gestión al cliente',
    ],
  }
  // Arrays planos derivados — usados para validación, búsqueda y compatibilidad.
  const HARD_SKILLS  = Object.values(HARD_SKILLS_CATEGORIAS).flat()
  const SOFT_SKILLS  = Object.values(POWER_SKILLS_CATEGORIAS).flat()
  const POWER_SKILLS = SOFT_SKILLS // alias para futuras refactorizaciones; no se usa en UI ya
  void HARD_SKILLS; void POWER_SKILLS  // referenciados como compat; eslint-no-unused-vars
  const INDUSTRIAS = ['Tecnología','Finanzas / Banca','Salud','Retail / FMCG','Manufactura','Consultoría','Educación','Gobierno','Startups','Energía']
  const MOVILIDAD = ['Presencial','Remoto','Híbrido']
  const toggle = function(key,val){
    const list = Array.isArray(d[key])?d[key]:[]
    up(key,list.includes(val)?list.filter(function(x){return x!==val}):list.concat([val]))
  }
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Brain size={16} className="text-violet-600" weight="duotone"/>¿En qué eres genuinamente bueno?</h3>
          <p className="text-xs text-slate-500">Selecciona tus habilidades reales en cada categoría.</p>
        </div>

        {/* Tip recomendado por mentores ELVIA */}
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3">
          <div className="text-xs font-black text-amber-900 uppercase tracking-wider mb-1">Recomendación de mentoría</div>
          <p className="text-xs text-amber-900 leading-relaxed">
            Lo ideal es seleccionar <strong>máximo 6 Hard Skills + 6 Power Skills</strong> — las que mejor te
            representen y estén alineadas a tu objetivo. Menos es más: 6 + 6 enfocadas comunican más que 20 dispersas.
          </p>
        </div>

        {/* Hard Skills — acordeón categorizado con buscador */}
        <SkillsAccordionPicker
          tema="hard"
          categorias={HARD_SKILLS_CATEGORIAS}
          seleccion={Array.isArray(d.hard_skills) ? d.hard_skills : []}
          onToggle={(val) => toggle('hard_skills', val)}
          icon={<Toolbox size={15} className="text-blue-600" weight="duotone"/>}
          titulo="Hard Skills"
          subtitulo='El “Saber hacer” · Competencias técnicas medibles · Recomendado máximo 6'
        />

        {/* Power Skills — mismo patrón visual, paleta esmeralda */}
        <SkillsAccordionPicker
          tema="power"
          categorias={POWER_SKILLS_CATEGORIAS}
          seleccion={Array.isArray(d.soft_skills) ? d.soft_skills : []}
          onToggle={(val) => toggle('soft_skills', val)}
          icon={<Heart size={15} className="text-emerald-600" weight="duotone"/>}
          titulo="Power Skills"
          subtitulo='El “Saber lograr” · Habilidades humanas de impacto · Recomendado máximo 6'
        />


      </div>
      {/* Botón de guardar */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${justSaved?'bg-emerald-600 text-white':'bg-violet-600 hover:bg-violet-700 text-white'}`}>
          {justSaved ? (<><CheckFat size={16} weight="fill"/> Guardado</>) : 'Guardar'}
        </button>
      </div>

      {modalIncompleto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(15,10,40,0.55)',backdropFilter:'blur(4px)'}} onClick={function(e){if(e.target===e.currentTarget)setModalIncompleto(null)}}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-violet-500 to-violet-600 rounded-t-3xl flex items-center gap-3">
              <WarningCircle size={24} className="text-white" weight="fill"/>
              <div><h2 className="text-white font-bold text-base leading-tight">Sección incompleta</h2><p className="text-violet-100 text-xs mt-0.5">Autoconocimiento tiene campos sin completar</p></div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-slate-600 mb-4">Para guardar correctamente y reflejar tu progreso, completa:</p>
              <ul className="space-y-2 mb-6">{modalIncompleto.map(function(item,i){return(<li key={i} className="flex items-start gap-2 text-sm text-slate-700"><span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">!</span>{item}</li>)})}</ul>
              <div className="flex gap-3">
                <button onClick={function(){setModalIncompleto(null)}} className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors cursor-pointer">Volver a completar</button>
                <button onClick={function(){setModalIncompleto(null);onSave(d)}} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer">Guardar así</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
