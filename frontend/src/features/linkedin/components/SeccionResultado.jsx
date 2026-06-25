// features/linkedin/components/SeccionResultado.jsx
// Card de resultado por sección (acordeón con diagnóstico, fortalezas, mejoras, ejemplo
// y el bloque editable). Componente props. Extraído verbatim desde pages/LinkedinPro.jsx.
import { useState } from 'react'
import { CaretUp, CaretDown, CheckCircle, LightbulbFilament, Sparkle } from '@phosphor-icons/react'
import { colorPuntaje } from '../helpers'
import BloqueEditable from './BloqueEditable'
import BloqueHabilidades from './BloqueHabilidades'

export default function SeccionResultado({ seccion, datos, original, editable, onEditableChange }) {
  const [abierto, setAbierto] = useState(true)
  const color = colorPuntaje(datos.puntaje)
  const esHabilidades = seccion.id === 'habilidades'

  return (
    <div className={`rounded-3xl border ${color.border} overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300`}>
      {/* Header de sección */}
      <button
        onClick={() => setAbierto(a => !a)}
        className={`w-full flex items-center gap-5 px-6 py-5 ${color.bg} hover:brightness-95 transition-all text-left`}
      >
        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl bg-white border ${color.border} shadow-sm shrink-0`}>
          <span className={`text-base font-black ${color.text}`}>{datos.puntaje}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-lg tracking-tight">{seccion.label}</p>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${color.labelBg} ${color.labelText}`}>
              {color.label}
            </span>
          </div>
          <div className="w-full h-2 bg-white/60 rounded-full mt-2 overflow-hidden border border-white/20">
            <div
              className={`h-full rounded-full ${color.bar} transition-all duration-700`}
              style={{ width: `${datos.puntaje}%` }}
            />
          </div>
        </div>
        {abierto ? <CaretUp size={16} className="text-gray-400 shrink-0" /> : <CaretDown size={16} className="text-gray-400 shrink-0" />}
      </button>

      {/* Contenido expandible */}
      {abierto && (
        <div className="px-5 py-4 bg-white space-y-4">
          {/* Diagnóstico general */}
          {datos.diagnostico && (
            <p className="text-sm text-gray-600 leading-relaxed">{datos.diagnostico}</p>
          )}

          {/* Fortalezas */}
          {datos.fortalezas?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 flex items-center gap-1.5">
                <CheckCircle size={13} weight="fill" /> Fortalezas
              </p>
              <ul className="space-y-1.5">
                {datos.fortalezas.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-0.5 shrink-0">•</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mejoras */}
          {datos.mejoras?.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1.5">
                <LightbulbFilament size={13} weight="fill" /> Qué mejorar
              </p>
              <ul className="space-y-1.5">
                {datos.mejoras.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-amber-500 mt-0.5 shrink-0">→</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ejemplo reescrito (recordatorio del análisis IA — sigue visible) */}
          {datos.ejemplo && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-1.5 flex items-center gap-1.5">
                <Sparkle size={12} weight="fill" /> Sugerencia de redacción
              </p>
              <p className="text-sm text-teal-800 leading-relaxed italic">"{datos.ejemplo}"</p>
            </div>
          )}

          {/* Nota Autoconocimiento solo para extracto */}
          {seccion.id === 'extracto' && (
            <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
              <LightbulbFilament size={15} weight="fill" className="text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                Esta sugerencia se generó tomando en cuenta tu Autoconocimiento y oferta de valor del Gerente de Proyecto.
              </p>
            </div>
          )}

          {/* Tip especial para idiomas */}
          {seccion.id === 'idiomas' && (
            <div className="flex items-start gap-2 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3">
              <LightbulbFilament size={15} weight="fill" className="text-sky-500 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-700 font-medium leading-relaxed">
                Es ideal determinar el nivel de inglés realista. Te recomendamos hacer algún test gratuito en línea de buena reputación o si tienes de alguna institución avalada del idioma, y tenerlo en cuenta para esta sección.
              </p>
            </div>
          )}

          {/* Bloque editable: el texto sugerido aplicado, listo para pegar en LinkedIn */}
          {esHabilidades ? (
            <BloqueHabilidades
              habilidades={editable}
              onChange={onEditableChange}
              original={original}
            />
          ) : (
            <BloqueEditable
              seccion={seccion}
              original={original}
              valor={editable}
              onChange={onEditableChange}
              maxLength={seccion.maxLength}
            />
          )}
        </div>
      )}
    </div>
  )
}
