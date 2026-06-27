// Registry ÚNICO de rutas — fuente de verdad de App.jsx.
//
// Antes App.jsx mantenía 5 arrays de strings paralelos (RUTAS_FULL, RUTAS_APP,
// RUTAS_SIN_GUARD, RUTAS_GATED, RUTAS_PUBLICAS) que había que actualizar a mano y
// podían desincronizarse con el <Routes>. Ahora cada ruta se declara UNA vez con su
// metadata, y los conjuntos derivados (layout, gating, skip de onboarding) se calculan
// de aquí. Agregar una ruta = una entrada en ROUTES.
//
// Campos de cada entrada:
//   path                 ruta de react-router (puede ser dinámica: '/empresas/:slug').
//   Component            componente lazy a renderizar (omitir si es redirect).
//   redirectTo           si está, la ruta solo hace <Navigate replace> a ese destino.
//   props                props extra para el Component (ej. { modoComercial: true }).
//   guard                'public' | 'private' | 'bienvenida' | null (sin guard).
//   layout               'app' (con sidebar/header) | 'full' (limpio). Default 'full'.
//   gated                true = requiere features desbloqueadas (Gerente al 100%).
//   skipOnboardingGuard  true = no redirige a /bienvenida aunque haya onboarding pendiente
//                        (páginas con formularios en progreso que no deben desmontarse).
import { lazy } from 'react'

const Landing2             = lazy(() => import('../pages/Landing2'))
const LandingMuyPronto     = lazy(() => import('../pages/LandingMuyPronto'))
const CVOptimizer          = lazy(() => import('../pages/CVOptimizer'))
const CVDesdeCero          = lazy(() => import('../pages/CVDesdeCero'))
const CVvsJob              = lazy(() => import('../pages/CVvsJob'))
const JobMatches           = lazy(() => import('../pages/JobMatches'))
const Auth                 = lazy(() => import('../pages/Auth'))
const MisCVs               = lazy(() => import('../pages/MisCVs'))
const MisVacantes          = lazy(() => import('../pages/MisVacantes'))
const Pipeline             = lazy(() => import('../pages/Pipeline'))
const Perfil               = lazy(() => import('../pages/Perfil'))
const Dashboard            = lazy(() => import('../pages/Dashboard'))
const BienvenidaOnboarding = lazy(() => import('../pages/BienvenidaOnboarding'))
const Admin                = lazy(() => import('../pages/Admin'))
const Entrevista           = lazy(() => import('../pages/Entrevista'))
const Biblioteca           = lazy(() => import('../pages/Biblioteca'))
const LinkedinPro          = lazy(() => import('../pages/LinkedinPro'))
const ResetPassword        = lazy(() => import('../pages/ResetPassword'))
const Expertos             = lazy(() => import('../pages/Expertos'))
const Infografias          = lazy(() => import('../pages/Infografias'))
const ProyectoLaboral      = lazy(() => import('../pages/ProyectoLaboral'))
const ReporteLaboral       = lazy(() => import('../pages/ReporteLaboral'))
const Bienestar            = lazy(() => import('../pages/Bienestar'))
const MisMetricas          = lazy(() => import('../pages/MisMetricas'))
const Cookies              = lazy(() => import('../pages/Cookies'))
const Ayuda                = lazy(() => import('../pages/Ayuda'))
const LandingEmpresa       = lazy(() => import('../pages/LandingEmpresa'))
const RegistroEmpresa      = lazy(() => import('../pages/RegistroEmpresa'))
const LoginHR              = lazy(() => import('../pages/LoginHR'))
const LoginEmpresa         = lazy(() => import('../pages/LoginEmpresa'))
const ActivarCuenta        = lazy(() => import('../pages/ActivarCuenta'))
const Privacidad           = lazy(() => import('../pages/Privacidad'))
const CompanyAdmin         = lazy(() => import('../pages/CompanyAdmin'))

// Orden preservado del <Routes> original (catch-all al final).
export const ROUTES = [
  // Recuperación de contraseña (también interceptada por el bloqueo nuclear en App).
  { path: '/reset-password', Component: ResetPassword, layout: 'full' },

  // Raíz: Landing2 en modo comercial (B2B + login para invitados).
  { path: '/', Component: Landing2, props: { modoComercial: true }, guard: 'public', layout: 'full' },

  // Rutas legacy deshabilitadas → redirigen a la raíz.
  { path: '/waitlist', redirectTo: '/', layout: 'full' },
  { path: '/inicio',   redirectTo: '/', layout: 'full' },
  { path: '/muy-pronto', Component: LandingMuyPronto, layout: 'full' },

  { path: '/auth',       Component: Auth, guard: 'public', layout: 'full' },
  { path: '/privacidad', Component: Privacidad, layout: 'full' },
  { path: '/cookies',    Component: Cookies, layout: 'full' },
  { path: '/bienvenida', Component: BienvenidaOnboarding, guard: 'bienvenida', layout: 'full' },

  // Landings co-brandeadas B2B / universidades + registro por slug.
  { path: '/empresas/:slug',          Component: LandingEmpresa,  layout: 'full' },
  { path: '/empresas/:slug/registro', Component: RegistroEmpresa, layout: 'full' },
  { path: '/empresas/:slug/hr',       Component: LoginHR,         layout: 'full' },
  { path: '/empresas/:slug/login',    Component: LoginEmpresa,    layout: 'full' },
  { path: '/empresas/:slug/activar',  Component: ActivarCuenta,   layout: 'full' },
  { path: '/universidades/:slug',          Component: LandingEmpresa,  layout: 'full' },
  { path: '/universidades/:slug/registro', Component: RegistroEmpresa, layout: 'full' },
  { path: '/universidades/:slug/hr',       Component: LoginHR,         layout: 'full' },
  { path: '/universidades/:slug/login',    Component: LoginEmpresa,    layout: 'full' },
  { path: '/universidades/:slug/activar',  Component: ActivarCuenta,   layout: 'full' },

  // Panel del HR Director / Gestor de programa B2B. skip: un usuario no-admin que caiga
  // aquí no debe redirigirse al onboarding (lo maneja el branch admin del guard).
  { path: '/empresa-admin', Component: CompanyAdmin, guard: 'private', layout: 'full', skipOnboardingGuard: true },

  // Admin / Especiales (sin guard de usuario).
  { path: '/admin',      Component: Admin,      layout: 'full' },
  { path: '/expertos',   Component: Expertos,   layout: 'app' },
  { path: '/infografias', Component: Infografias, layout: 'app' },
  { path: '/proyecto-laboral', Component: ProyectoLaboral, guard: 'private', layout: 'app', skipOnboardingGuard: true },
  { path: '/reporte-visual/:id', Component: ReporteLaboral, guard: 'private', layout: 'full' },
  { path: '/bienestar', Component: Bienestar, guard: 'private', layout: 'app' },

  // Privadas (Auth + Onboarding). `gated` = requieren features desbloqueadas.
  { path: '/dashboard',     Component: Dashboard,   guard: 'private', layout: 'app', gated: true },
  { path: '/cv-optimizer',  Component: CVOptimizer, guard: 'private', layout: 'app', gated: true },
  { path: '/cv-desde-cero', Component: CVDesdeCero, guard: 'private', layout: 'app', skipOnboardingGuard: true },
  { path: '/cv-vs-job',     Component: CVvsJob,     guard: 'private', layout: 'app', gated: true },
  { path: '/jobs',          Component: JobMatches,  guard: 'private', layout: 'app', gated: true },
  { path: '/mis-cvs',       Component: MisCVs,      guard: 'private', layout: 'app', gated: true },
  { path: '/mis-vacantes',  Component: MisVacantes, guard: 'private', layout: 'app', gated: true },
  { path: '/pipeline',      Component: Pipeline,    guard: 'private', layout: 'app', gated: true },
  { path: '/perfil',        Component: Perfil,      guard: 'private', layout: 'app' },
  { path: '/entrevista',    Component: Entrevista,  guard: 'private', layout: 'app', gated: true },
  { path: '/biblioteca',    Component: Biblioteca,  guard: 'private', layout: 'app', gated: true },
  // /linkedin-pro está en skip Y gated; skip tiene precedencia (igual que el original).
  { path: '/linkedin-pro',  Component: LinkedinPro, guard: 'private', layout: 'app', gated: true, skipOnboardingGuard: true },
  { path: '/mis-metricas',  Component: MisMetricas, guard: 'private', layout: 'app', gated: true },
  { path: '/ayuda',         Component: Ayuda,       guard: 'private', layout: 'app' },

  // Legacy: /onboarding → /bienvenida.
  { path: '/onboarding', redirectTo: '/bienvenida', layout: 'app' },

  // CATCH-ALL: cualquier ruta no válida → home.
  { path: '*', redirectTo: '/', layout: 'full' },
]

// ── Conjuntos derivados (los consumen App.jsx y routes/decisions.js) ──────────
// Solo paths estáticos (las rutas con :param nunca matchean por string exacto, igual
// que el comportamiento original que usaba Array.includes sobre el pathname).
const staticPaths = (pred) =>
  new Set(ROUTES.filter((r) => !r.path.includes(':') && r.path !== '*' && pred(r)).map((r) => r.path))

export const APP_PATHS             = staticPaths((r) => r.layout === 'app')
export const GATED_PATHS           = staticPaths((r) => r.gated === true)
export const SKIP_ONBOARDING_PATHS = staticPaths((r) => r.skipOnboardingGuard === true)
