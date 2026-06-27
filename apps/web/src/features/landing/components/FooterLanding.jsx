// features/landing/components/FooterLanding.jsx
// Footer minimalista de la landing.
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { Link } from 'react-router-dom'

export default function FooterLanding() {
  return (
    <footer className="relative z-10 border-t border-gray-100 bg-white">
      <div className="container mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Link to="/">
            <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-10 w-auto opacity-90" />
          </Link>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-widest text-center md:text-left">
            <span style={{ color: '#0D9488' }}>CONECTA</span> TU PRESENTE CON EL FUTURO QUE QUIERES.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          <Link to="/privacidad" className="text-sm font-bold text-gray-500 hover:text-teal-600 transition-colors">Privacidad</Link>
          <span className="text-gray-200 hidden sm:block">|</span>
          <span className="text-sm font-bold text-gray-500">© {new Date().getFullYear()} ELVIA</span>
        </div>
      </div>
    </footer>
  )
}
