// features/landing/constants.js
// Data estática de la landing de marketing.
// Extraído verbatim desde pages/Landing2.jsx (Fase 3).
import {
  FileMagnifyingGlass, MagnifyingGlass, Briefcase, Kanban,
  ChartBar, Folders, BookmarkSimple, Books, LinkedinLogo,
  MicrophoneStage, UsersThree,
} from '@phosphor-icons/react'

// ─── Features data (fuera del componente para evitar re-renders) ───────────────
export const GRAD = {
  orange: 'linear-gradient(135deg, #E8541A 0%, #F59E0B 100%)',
  teal:   'linear-gradient(135deg, #0D9488 0%, #059669 100%)',
  blue:   'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
}

export const FEATURE_ROWS = {
  heroes: [
    {
      Icon: FileMagnifyingGlass,
      titulo: 'Optimizador de CV',
      desc: 'Tu CV habla primero. Haz que diga lo correcto — formato Harvard, lenguaje de impacto, filtros ATS superados.',
      cta: 'Optimizar mi CV',
      gradientStyle: GRAD.orange,
      iconBg: 'bg-[#E8541A]/10', iconColor: 'text-[#E8541A]',
    },
    {
      Icon: MagnifyingGlass,
      titulo: 'CV vs Vacante',
      desc: '¿Eres el candidato ideal? Descúbrelo con un % de match real antes de perder tiempo aplicando.',
      cta: 'Medir mi compatibilidad',
      gradientStyle: GRAD.orange,
      iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
    },
    {
      Icon: UsersThree,
      titulo: 'Autoconocimiento',
      subtitulo: 'Tu primer paso',
      desc: 'Un onboarding para que conozcas tu momento actual y hacia donde quieres ir. Prepárate para tu transición profesional.',
      cta: 'Comenzar',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
      featured: true,
    },
  ],
  carrera: [
    {
      Icon: Briefcase,
      titulo: 'Vacantes',
      desc: 'Las oportunidades correctas, ya filtradas. Sin horas perdidas en portales.',
      cta: 'Ver vacantes',
      gradientStyle: GRAD.teal,
      iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
    },
    {
      Icon: Folders,
      titulo: 'Mis CVs',
      desc: 'Todas tus versiones, siempre listas. Adapta sin volver a empezar.',
      cta: 'Ver mis CVs',
      gradientStyle: GRAD.teal,
      iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
    },
    {
      Icon: BookmarkSimple,
      titulo: 'Mis Vacantes',
      desc: 'Guarda las que te interesan. Compara y aplica cuando estés listo.',
      cta: 'Ver guardadas',
      gradientStyle: GRAD.teal,
      iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
    },
    {
      Icon: Kanban,
      titulo: 'Pipeline',
      desc: 'Tu búsqueda laboral bajo control. Sabe exactamente en qué punto estás en cada proceso.',
      cta: 'Ver mi pipeline',
      gradientStyle: GRAD.teal,
      iconBg: 'bg-teal-100', iconColor: 'text-teal-600',
    },
  ],
  recursos: [
    {
      Icon: Books,
      titulo: 'Biblioteca',
      desc: 'El conocimiento que nadie te enseñó. Guías para dominar las reglas del juego.',
      cta: 'Explorar',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
    {
      Icon: ChartBar,
      titulo: 'Bienestar',
      desc: 'Ejercicios sencillos para cuando el estrés llega. Cuida tu salud mental durante la búsqueda.',
      cta: 'Ver ejercicios',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
    {
      Icon: LinkedinLogo,
      titulo: 'LinkedIn Pro',
      desc: 'Tu perfil optimizado para aparecer cuando los recruiters que importan están buscando.',
      cta: 'Optimizar perfil',
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
    {
      Icon: MicrophoneStage,
      titulo: 'Entrevista',
      desc: 'Practica hasta que no haya pregunta difícil. Llega seguro cuando más importa.',
      cta: 'Próximamente',
      upcoming: true,
      gradientStyle: GRAD.blue,
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    },
  ],
}
