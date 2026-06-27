// features/landing/components/NavLanding.jsx
// Nav sticky de la landing (logo + acciones según sesión / modoComercial).
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { Link } from 'react-router-dom'
import { Coins, ArrowRight, SignOut } from '@phosphor-icons/react'
import { supabase } from '../../../services/authService'

export default function NavLanding({ user, perfil, creditosRestantes, LIMITE_PLAN, modoComercial, navigate }) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-24 bg-white/80 backdrop-blur-xl border-b border-gray-200/80 transition-all duration-300">
      <Link to="/" className="flex items-center">
        <img src="/LOGOS/ELVIA_logo_fondo_transparente.png" alt="ELVIA" className="h-10 py-1 w-auto object-contain" />
      </Link>

      {/* Acciones nav */}
      <div className="flex items-center gap-3 sm:gap-6">
        {user ? (
          <>
            <div className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border
              ${creditosRestantes === 0 ? 'text-red-600 bg-red-50 border-red-200'
                : creditosRestantes === 1 ? 'text-amber-600 bg-amber-50 border-amber-200'
                : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
              <Coins size={15} weight="duotone" />
              {creditosRestantes} / {LIMITE_PLAN} Créditos
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-600">
              {perfil?.nombre1 || user.email?.split('@')[0]}
            </span>
            <button onClick={() => navigate('/cv-optimizer')}
              className="hidden sm:flex items-center gap-2 bg-[#E8541A] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#E8541A]/90 transition-all shadow-md">
              Plataforma <ArrowRight size={15} weight="bold" />
            </button>
            <button
              onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
              title="Cerrar sesión"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-gray-700 hover:bg-gray-100 px-3 py-2.5 rounded-xl transition-colors">
              <SignOut size={18} weight="bold" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => navigate('/auth')}
              className={modoComercial
                ? "flex items-center gap-2 bg-[#E8541A] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#E8541A]/90 transition-all shadow-md shadow-[#E8541A]/20"
                : "hidden sm:inline-flex items-center justify-center px-4 py-2.5 text-sm font-bold text-gray-700 bg-transparent border-2 border-gray-200 hover:border-gray-300 hover:text-gray-900 rounded-xl transition-all shadow-sm"
              }>
              Iniciar sesión
            </button>
            {!modoComercial && (
              <button onClick={() => navigate('/auth?register=true')}
                className="flex items-center gap-2 bg-[#E8541A] text-white font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#E8541A]/90 transition-all shadow-md shadow-[#E8541A]/20">
                Empezar gratis
              </button>
            )}
          </>
        )}
      </div>
    </nav>
  )
}
