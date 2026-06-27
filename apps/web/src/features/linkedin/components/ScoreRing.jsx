// features/linkedin/components/ScoreRing.jsx
// Anillo de puntaje global. Componente puro (prop: score). Extraído verbatim desde pages/LinkedinPro.jsx.
import { colorPuntaje } from '../helpers'

export default function ScoreRing({ score }) {
  const color = colorPuntaje(score)
  return (
    <div className={`flex flex-col items-center justify-center w-36 h-36 rounded-full border-[6px] ${color.border} ${color.bg} shrink-0 shadow-2xl shadow-slate-200/50 relative overflow-hidden group`}>
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${color.bar} to-transparent`} />
      <span className={`text-5xl font-black ${color.text} relative z-10 tracking-tighter`}>{score}</span>
      <span className={`text-[12px] font-black ${color.text} uppercase tracking-widest relative z-10 opacity-60`}>/ 100</span>
      {/* Decorative pulse */}
      <div className={`absolute inset-0 rounded-full border-4 border-white/40 group-hover:scale-110 transition-transform duration-700`} />
    </div>
  )
}
