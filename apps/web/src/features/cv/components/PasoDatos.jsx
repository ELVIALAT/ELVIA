// features/cv/components/PasoDatos.jsx
// PASO 0 del wizard — Datos personales (+ upload de CV para autollenado).
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import HelpBadge from '../../../components/common/HelpBadge'
import { SpinnerGap, UploadSimple, WarningCircle, CheckCircle, Warning } from '@phosphor-icons/react'
import { PAISES } from '../constants'
import { useCVWizard } from '../CVWizardContext'

export default function PasoDatos() {
  const {
    modoForzado, fileRef, extraerCV, cvFileName, extrayendo, cvMismatch,
    setCvMismatch, setCvPending, setCvFileName, analisis, cvIdioma, error,
    datos, upDatos, tipsPorPaso,
  } = useCVWizard()
  const tips = tipsPorPaso.datos
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
        <h2 className="text-base font-bold text-slate-800">Datos Personales</h2>
        <HelpBadge id="cvdesdecero.datos" />
      </div>
      {/* Upload CV — oculto en modo 'scratch' (el usuario eligió empezar desde cero desde el pilar) */}
      {modoForzado !== 'scratch' && (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-2xl p-5">
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx"
          onChange={e => extraerCV(e.target.files?.[0])} className="hidden" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-700">¿Tienes un CV? Súbelo y llenamos el formulario</p>
            <p className="text-xs text-slate-400 mt-0.5">{cvFileName || 'PDF o Word · Max. 5MB · Se respeta el idioma del CV'}</p>
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={extrayendo}
            className={`flex items-center gap-2 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer ${extrayendo ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {extrayendo ? <SpinnerGap size={14} className="animate-spin" /> : <UploadSimple size={14} weight="bold" />}
            {extrayendo ? 'Analizando...' : cvFileName ? 'Cambiar' : 'Cargar CV'}
          </button>
        </div>

        {/* Banner de mismatch (CV de otra persona) */}
        {cvMismatch && (
          <div className="mt-3 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
            <WarningCircle size={16} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-bold text-red-700">El CV no corresponde al usuario registrado</p>
              <p className="text-xs text-red-600 leading-relaxed">
                No se puede subir información de terceros sin su previa autorización. Para mayor información lee nuestros{' '}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-red-800">
                  Términos & Condiciones y Privacidad de Datos
                </a>.
              </p>
              <button
                onClick={() => {
                  setCvMismatch(false)
                  setCvPending(null)
                  setCvFileName('')
                  fileRef.current.value = ''
                  fileRef.current?.click()
                }}
                className="flex items-center gap-1.5 text-xs text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors">
                <UploadSimple size={12} weight="bold" /> Cargar otro CV
              </button>
            </div>
          </div>
        )}

        {/* Banner de éxito al extraer */}
        {!cvMismatch && cvFileName && analisis && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-white border border-green-200">
            <CheckCircle size={15} weight="fill" className="text-green-500 shrink-0" />
            <p className="text-xs text-slate-700">
              Datos extraídos de <span className="font-bold">{cvFileName}</span> — revisa y ajusta si es necesario
            </p>
          </div>
        )}

        {/* Aviso de idioma detectado distinto al español */}
        {!cvMismatch && cvIdioma && cvIdioma !== 'es' && cvFileName && (
          <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <Warning size={15} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Tu CV está en <span className="font-bold">{cvIdioma === 'en' ? 'inglés' : cvIdioma === 'pt' ? 'portugués' : cvIdioma === 'fr' ? 'francés' : cvIdioma.toUpperCase()}</span>.
              Las sugerencias de resumen se generarán en ese idioma. Al llegar al último paso podrás elegir el idioma del CV final.
            </p>
          </div>
        )}
      </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl">
          <WarningCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Datos personales</p>

      <div className="grid grid-cols-2 gap-3">
        {[['nombre','Primer nombre *'],['nombre2','Segundo nombre'],['apellido','Primer apellido *'],['apellido2','Segundo apellido']].map(([k, l]) => (
          <input key={k} type="text" placeholder={l} value={datos[k]} onChange={e => upDatos(k, e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
        ))}
      </div>

      <input type="email" placeholder="Correo electrónico" value={datos.email} onChange={e => upDatos('email', e.target.value)}
        className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />

      <div className="flex gap-2">
        <select value={datos.indicativo} onChange={e => upDatos('indicativo', e.target.value)}
          className="border border-slate-300 rounded-xl px-2 py-2.5 text-sm focus:outline-none w-24 shrink-0">
          {['+1','+52','+57','+54','+55','+34','+39','+49','+33'].map(ind => <option key={ind} value={ind}>{ind}</option>)}
        </select>
        <input type="tel" placeholder="Teléfono" value={datos.telefono} onChange={e => upDatos('telefono', e.target.value)}
          className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input type="text" placeholder="Ciudad" value={datos.ciudad} onChange={e => upDatos('ciudad', e.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
        <select value={datos.pais} onChange={e => upDatos('pais', e.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
          <option value="">País</option>
          {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <input type="text" placeholder="Cargo objetivo (ej. Gerente de Marketing, Analista Senior, CFO...)"
          value={datos.cargo_objetivo} onChange={e => upDatos('cargo_objetivo', e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
        {datos.cargo_objetivo && (() => {
          const c = datos.cargo_objetivo.toLowerCase()
          const s = /c-?level|ceo|cfo|coo|cto|cpo|chief|vp\b|vice|vicepresidente/.test(c) ? { label: 'C-Level / VP', color: 'bg-purple-100 text-purple-700' }
            : /gerente|director|head of|l[ií]der\b|lead\b/.test(c) ? { label: 'Senior (Gerente/Director)', color: 'bg-blue-100 text-blue-700' }
            : /jefe|coordinador|supervisor|especialista\b/.test(c) ? { label: 'Mid-Senior (Jefe/Coordinador)', color: 'bg-indigo-100 text-indigo-700' }
            : /analista|asistente|auxiliar|jr\b|junior/.test(c) ? { label: 'Junior (Analista/Asistente)', color: 'bg-emerald-100 text-emerald-700' }
            : null
          return s ? <span className={`inline-block mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${s.color}`}>Seniority: {s.label}</span> : null
        })()}
      </div>

      {tips.length > 0 && (
        <div className="mt-1 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs font-bold text-amber-800 mb-1.5">💡 Tips para mejorar esta sección:</p>
          <ul className="space-y-1">{tips.map((t,i)=><li key={i} className="text-xs text-amber-700 flex gap-1.5"><span className="shrink-0">→</span><span>{t}</span></li>)}</ul>
        </div>
      )}
    </div>
  )
}
