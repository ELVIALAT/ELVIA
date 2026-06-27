// features/landing/components/BannerOnboarding.jsx
// Banner que invita a completar el onboarding (solo si está incompleto).
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import { Warning, ArrowRight } from '@phosphor-icons/react'

export default function BannerOnboarding({ navigate }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-center sm:justify-between gap-4 relative z-40 flex-wrap">
      <div className="flex items-center gap-3">
        <Warning size={20} weight="duotone" className="text-amber-500" />
        <p className="text-sm text-amber-800 font-medium">
          Completa tu perfil para desbloquear todas las herramientas de IA.
        </p>
      </div>
      <button
        onClick={() => navigate('/onboarding')}
        className="text-sm font-bold bg-amber-500 text-white px-5 py-1.5 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 shrink-0">
        Continuar <ArrowRight size={14} weight="bold" />
      </button>
    </div>
  )
}
