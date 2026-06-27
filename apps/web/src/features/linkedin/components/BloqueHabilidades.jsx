// features/linkedin/components/BloqueHabilidades.jsx
// Bloque editable especial para habilidades — chips removibles + entrada nueva + copiar todo.
// Componente props. Extraído verbatim desde pages/LinkedinPro.jsx (Fase 3).
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Copy, EyeSlash, Eye, PencilSimple } from '@phosphor-icons/react'
import { copiarPortapapeles } from '../helpers'

export default function BloqueHabilidades({ habilidades, onChange, original }) {
  const [nuevaSkill, setNuevaSkill] = useState('')
  const [verOriginal, setVerOriginal] = useState(false)
  const lista = Array.isArray(habilidades) ? habilidades : []
  const eliminar = (i) => onChange(lista.filter((_, idx) => idx !== i))
  const agregar = () => {
    const v = nuevaSkill.trim()
    if (!v) return
    if (lista.includes(v)) {
      toast('Esa habilidad ya está en la lista', { icon: 'ℹ️' })
      setNuevaSkill('')
      return
    }
    if (lista.length >= 50) {
      toast.error('LinkedIn permite máximo 50 habilidades')
      return
    }
    onChange([...lista, v])
    setNuevaSkill('')
  }
  return (
    <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
          <PencilSimple size={13} weight="fill" /> Tus aptitudes — edita la lista antes de pegarlas
        </p>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {lista.length} / 50
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3 min-h-[48px] bg-slate-50 p-3 rounded-xl">
        {lista.length === 0 && (
          <span className="text-xs text-slate-400 italic">Las habilidades sugeridas aparecerán aquí.</span>
        )}
        {lista.map((s, i) => (
          <span key={`${s}-${i}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-sm">
            {s}
            <button
              type="button"
              onClick={() => eliminar(i)}
              className="text-emerald-500 hover:text-rose-500 transition-colors font-bold text-sm"
              aria-label={`Eliminar ${s}`}
            >×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={nuevaSkill}
          onChange={e => setNuevaSkill(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar() } }}
          placeholder="Agregar aptitud y presionar Enter"
          className="flex-1 rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white"
        />
        <button
          type="button"
          onClick={agregar}
          disabled={!nuevaSkill.trim()}
          className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 disabled:opacity-40 transition-all"
        >Agregar</button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copiarPortapapeles(lista.join('\n'), 'Aptitudes')}
          disabled={lista.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Copy size={13} weight="bold" /> Copiar todas
        </button>
        {original ? (
          <button
            type="button"
            onClick={() => setVerOriginal(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
          >
            {verOriginal
              ? <><EyeSlash size={13} weight="bold" /> Ocultar mi lista actual</>
              : <><Eye size={13} weight="bold" /> Ver mi lista actual</>
            }
          </button>
        ) : null}
      </div>
      {verOriginal && original ? (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Tus aptitudes actuales</p>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{original}</p>
        </div>
      ) : null}
    </div>
  )
}
