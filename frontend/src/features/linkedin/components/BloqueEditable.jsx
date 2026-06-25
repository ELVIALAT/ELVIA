// features/linkedin/components/BloqueEditable.jsx
// Bloque editable + botones (Copiar / Ver original) para una sección de texto largo.
// El usuario decide qué pegar en LinkedIn — el AI propone, NO impone. Componente props.
// Extraído verbatim desde pages/LinkedinPro.jsx (Fase 3).
import { useState } from 'react'
import { Copy, EyeSlash, Eye, PencilSimple } from '@phosphor-icons/react'
import { copiarPortapapeles } from '../helpers'

export default function BloqueEditable({ seccion, original, valor, onChange, maxLength }) {
  const [verOriginal, setVerOriginal] = useState(false)
  return (
    <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
          <PencilSimple size={13} weight="fill" /> Tu {seccion.label.toLowerCase()} — edítalo si quieres antes de pegarlo
        </p>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {(valor || '').length}{maxLength ? ` / ${maxLength}` : ''}
        </span>
      </div>
      <textarea
        value={valor || ''}
        onChange={e => onChange(e.target.value)}
        rows={Math.max(seccion.rows || 4, 4)}
        maxLength={maxLength}
        className="w-full resize-none rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:bg-white leading-relaxed"
        placeholder={`Aquí aparecerá la sugerencia generada para ${seccion.label}. Edítala antes de pegarla en LinkedIn.`}
      />
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => copiarPortapapeles(valor || '', seccion.label)}
          disabled={!valor}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Copy size={13} weight="bold" /> Copiar al portapapeles
        </button>
        {original ? (
          <button
            type="button"
            onClick={() => setVerOriginal(v => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
          >
            {verOriginal
              ? <><EyeSlash size={13} weight="bold" /> Ocultar mi texto actual</>
              : <><Eye size={13} weight="bold" /> Ver mi texto actual</>
            }
          </button>
        ) : null}
      </div>
      {verOriginal && original ? (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Texto original tuyo</p>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{original}</p>
        </div>
      ) : null}
    </div>
  )
}
