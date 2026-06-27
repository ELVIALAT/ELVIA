// components/cv-vs-job/PerfilAvisos.jsx
// Extraído verbatim desde pages/CVvsJob.jsx (Fase 3, archivos >800).
// Avisos contextuales de perfil: sugiere completar skills / oferta de valor en el Gerente de Proyecto.

export default function PerfilAvisos({ jpData, onIrAlGerente }) {
  const avisos = []
  const hard = jpData?.autoconocimiento?.hard_skills || []
  const soft = jpData?.autoconocimiento?.soft_skills || []
  if (hard.length < 2 || soft.length < 2) {
    avisos.push('Agrega al menos 2 Hard Skills y 2 Power Skills en el Gerente de Proyecto para que el análisis de compatibilidad sea más preciso.')
  }
  const oferta = String(jpData?.oferta?.oferta_valor || '').trim()
  if (!oferta) {
    avisos.push('Completa tu Oferta de Valor en el Gerente de Proyecto para que el análisis identifique mejor tus fortalezas.')
  }
  if (!avisos.length) return null
  return (
    <div className="space-y-2 mb-4">
      {avisos.map((msg, i) => (
        <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
          <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>{msg} <button onClick={onIrAlGerente} className="underline font-semibold ml-0.5">Ir al Gerente de Proyecto →</button></span>
        </div>
      ))}
    </div>
  )
}
