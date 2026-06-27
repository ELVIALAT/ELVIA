import { useState } from 'react'

export default function InfoVacante({ title, company, location, link, via, snippet, jobText }) {
  const [verTexto, setVerTexto] = useState(false)
  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Vacante</p>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      {company && <p className="text-xs text-gray-600 mt-0.5 font-medium">{company}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
        {location && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {location}
          </span>
        )}
        {via && <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5">{via}</span>}
      </div>
      {snippet && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{snippet}</p>}
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Ver vacante original
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
      )}
      {jobText && (
        <div className="mt-2 border-t border-gray-200 pt-2">
          <button
            onClick={() => setVerTexto(v => !v)}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 transition-colors"
          >
            <svg className={`w-3 h-3 transition-transform ${verTexto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
            {verTexto ? 'Ocultar descripción' : 'Ver descripción de la vacante'}
          </button>
          {verTexto && (
            <pre className="mt-2 text-[11px] text-gray-600 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto bg-white border border-gray-100 rounded-lg p-3">
              {jobText}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
