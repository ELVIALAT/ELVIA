// features/interview/components/Estrellas.jsx
// Estrellas de calificación (1-5). Componente puro. Extraído verbatim desde pages/Entrevista.jsx.
import { Star } from '@phosphor-icons/react'

export default function Estrellas({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={14} weight={i <= n ? 'fill' : 'regular'}
          className={i <= n ? 'text-amber-400' : 'text-gray-300'} />
      ))}
    </div>
  )
}
