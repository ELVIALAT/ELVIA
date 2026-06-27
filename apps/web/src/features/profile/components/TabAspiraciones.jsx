// features/profile/components/TabAspiraciones.jsx
// Tab "Aspiraciones" del Perfil. Extraído verbatim de pages/Perfil.jsx (Fase 3 refinamiento).
import {
  EXPERIENCIAS, INDUSTRIAS_LATAM, NIVELES_CARGO, AREAS, TIPOS_TRABAJO,
  IDIOMAS, NIVELES_CEFR, NIVELES_EDUCACION,
} from '../constants'
import HelpBadge from '../../../components/common/HelpBadge'

export default function TabAspiraciones({
  form, set, setForm, toggleArea, toggleIndustria, toggleIdioma,
  updateNivelIdioma, agregarEducacion, quitarEducacion, updateEducacion,
}) {
  return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              Aspiraciones Profesionales
              <HelpBadge id="perfil.aspiraciones" />
            </h2>
          </div>

          {/* Cargo actual / objetivo / experiencia */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Perfil profesional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cargo actual</label>
                <input type="text" value={form.cargo_actual} onChange={set('cargo_actual')} placeholder="Gerente de RH"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cargo objetivo</label>
                <input type="text" value={form.cargo_objetivo} onChange={set('cargo_objetivo')} placeholder="Director de RH"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Años de experiencia</label>
                <select value={form.experiencia_anos} onChange={set('experiencia_anos')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecciona</option>
                  {EXPERIENCIAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Industria actual</label>
                <select value={form.industria_actual} onChange={set('industria_actual')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecciona tu industria</option>
                  {INDUSTRIAS_LATAM.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Nivel de cargo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Nivel de cargo buscado</label>
            <div className="flex flex-wrap gap-2">
              {NIVELES_CARGO.map(n => (
                <button key={n} onClick={() => setForm(f=>({...f,nivel_cargo:n}))}
                  className={`text-xs font-medium px-3 py-2 rounded-full border transition-colors
                    ${form.nivel_cargo === n ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Área funcional — multi-select */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Área funcional <span className="text-gray-400 font-normal">(múltiple)</span></label>
            <div className="flex flex-wrap gap-2">
              {AREAS.map(a => (
                <button key={a} onClick={() => toggleArea(a)}
                  className={`text-xs font-medium px-3 py-2 rounded-full border transition-colors
                    ${form.areas.includes(a) ? 'bg-secondary text-on-secondary border-secondary' : 'border-gray-300 text-gray-600 hover:border-secondary hover:text-secondary'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de trabajo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Tipo de trabajo</label>
            <div className="flex gap-2">
              {TIPOS_TRABAJO.map(t => (
                <button key={t} onClick={() => setForm(f=>({...f,tipo_trabajo:t}))}
                  className={`flex-1 text-xs font-medium py-2.5 rounded-xl border transition-colors
                    ${form.tipo_trabajo === t ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Industrias */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Industrias de interés <span className="text-gray-400 font-normal">(múltiple)</span></label>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {INDUSTRIAS_LATAM.map(ind => (
                <button key={ind} onClick={() => toggleIndustria(ind)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                    ${form.industrias_deseadas.includes(ind)
                      ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {ind}
                </button>
              ))}
            </div>
          </div>

          {/* Idiomas */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              Idiomas <span className="text-gray-400 font-normal">(selecciona y asigna nivel CEFR)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {IDIOMAS.map(idioma => {
                const sel = form.idiomas.find(i => i.idioma === idioma)
                return (
                  <button key={idioma} onClick={() => toggleIdioma(idioma)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                      ${sel
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 text-gray-500 hover:border-primary hover:text-primary'}`}>
                    {idioma}
                  </button>
                )
              })}
            </div>
            {form.idiomas.length > 0 && (
              <div className="space-y-2">
                {form.idiomas.map(({ idioma, nivel }) => (
                  <div key={idioma} className="flex items-center gap-3 p-2.5 bg-primary/5 rounded-lg border border-primary/20">
                    <span className="text-xs font-medium text-gray-800 flex-1">{idioma}</span>
                    <select value={nivel} onChange={e => updateNivelIdioma(idioma, e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                      {NIVELES_CEFR.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <button onClick={() => toggleIdioma(idioma)} className="text-gray-400 hover:text-red-500 text-base leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Educación */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500">Educación</label>
              <button onClick={agregarEducacion}
                className="text-xs font-medium text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors">
                + Agregar
              </button>
            </div>
            {form.educacion.length === 0 && (
              <p className="text-xs text-gray-400 py-1">Agrega tu formación académica (opcional)</p>
            )}
            <div className="space-y-3">
              {form.educacion.map((edu, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500">Educación {idx + 1}</span>
                    <button onClick={() => quitarEducacion(idx)} className="text-xs text-gray-400 hover:text-red-500 transition-colors">✕ Eliminar</button>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nivel académico</label>
                    <select value={edu.nivel} onChange={e => updateEducacion(idx, 'nivel', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Selecciona</option>
                      {NIVELES_EDUCACION.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Título / Programa</label>
                    <input type="text" value={edu.titulo} onChange={e => updateEducacion(idx, 'titulo', e.target.value)}
                      placeholder="Ej. Ingeniería Industrial"
                      className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Institución</label>
                      <input type="text" value={edu.institucion} onChange={e => updateEducacion(idx, 'institucion', e.target.value)}
                        placeholder="Ej. UNAM"
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Año de graduación</label>
                      <input type="text" value={edu.anio} onChange={e => updateEducacion(idx, 'anio', e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="2020" maxLength={4}
                        className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
  )
}
