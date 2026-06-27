export default function BotonesDescarga({ id, descargando, onDescargar, soloSiOptimizado = false, score = null }) {
  if (soloSiOptimizado && score !== null && score < 70) {
    return (
      <span className="text-xs text-gray-400 italic">No disponible (compatibilidad {'<'} 70%)</span>
    )
  }
  return (
    <div className="flex gap-2 shrink-0">
      <button onClick={() => onDescargar(id, 'pdf')} disabled={!!descargando[id]}
        className="text-xs border border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
        {descargando[id] === 'pdf' ? '...' : '↓ PDF'}
      </button>
      <button onClick={() => onDescargar(id, 'word')} disabled={!!descargando[id]}
        className="text-xs border border-gray-300 text-gray-600 hover:border-primary hover:text-primary rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
        {descargando[id] === 'word' ? '...' : '↓ Word'}
      </button>
    </div>
  )
}
