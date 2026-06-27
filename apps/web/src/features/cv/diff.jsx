// features/cv/diff.jsx
// Helpers de visualización de diff entre textos (resaltan palabras nuevas).
// Extraído verbatim desde pages/CVDesdeCero.jsx (Fase 3). Funciones puras que
// devuelven JSX — compartidas por PasoResumen y PasoExperiencia.

// Compara dos textos y pone en negrita las palabras nuevas — soporta multi-línea
export const renderDiff = (original, sugerido) => {
  if (!original || !sugerido) return sugerido
  const wordsO = new Set(original.toLowerCase().split(/\s+/).map(w => w.replace(/[.,•\-*]/g, '')))
  return sugerido.split('\n').map((line, li) => (
    <span key={li} style={{ display: 'block' }}>
      {line.split(/\s+/).map((w, wi) => {
        const clean = w.toLowerCase().replace(/[.,•\-*]/g, '')
        return wordsO.has(clean) || clean === ''
          ? <span key={wi}>{w} </span>
          : <strong key={wi} className="text-indigo-700 font-bold">{w} </strong>
      })}
    </span>
  ))
}

// Compara el resumen del CV y la Fusión, resaltando las adiciones en verde esmeralda
export const renderDiffFusion = (original, sugerido) => {
  if (!original || !sugerido) return sugerido
  const wordsO = new Set(original.toLowerCase().split(/\s+/).map(w => w.replace(/[.,•\-*]/g, '')))
  return sugerido.split('\n').map((line, li) => (
    <span key={li} style={{ display: 'block' }}>
      {line.split(/\s+/).map((w, wi) => {
        const clean = w.toLowerCase().replace(/[.,•\-*]/g, '')
        return wordsO.has(clean) || clean === ''
          ? <span key={wi}>{w} </span>
          : <span key={wi} className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-black border border-emerald-100 inline-block m-0.5 text-[11px] leading-none">{w} </span>
      })}
    </span>
  ))
}
