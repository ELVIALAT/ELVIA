// features/cv/components/Tooltip.jsx
// Tooltip de ayuda contextual. Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3).
import { useState } from 'react'
import { Question } from '@phosphor-icons/react'

export default function Tooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative inline-block">
      <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        className="text-slate-400 hover:text-slate-600 transition-colors cursor-help ml-1">
        <Question size={16} weight="fill" />
      </button>
      {show && (
        <div className="absolute z-20 bottom-full right-0 mb-2 w-52 bg-slate-800 text-white text-xs p-2.5 rounded-lg shadow-lg leading-relaxed">
          {text}
        </div>
      )}
    </div>
  )
}
