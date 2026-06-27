// Lógica PURA de los guards de ruta, extraída de App.jsx para poder testearla.
//
// Los guards de App.jsx (PublicRoute, OnboardingGuard, PrivateRoute, BienvenidaRoute)
// son el límite de seguridad de la app (auth, onboarding, gating de features, bypass de
// admin/HR, recovery-mode). Antes esa lógica vivía inline en componentes sin tests. Aquí
// se aísla como funciones puras de (estado) -> decisión, byte-equivalentes al original,
// para que routes/decisions.test.js congele el comportamiento.
//
// Cada función devuelve una de tres formas:
//   { type: 'wait' }                  -> el guard renderiza null (aún cargando).
//   { type: 'render' }                -> el guard renderiza sus children.
//   { type: 'redirect', to: '/x' }    -> el guard hace <Navigate to="/x" replace />.
import { APP_PATHS, GATED_PATHS, SKIP_ONBOARDING_PATHS } from './registry'

const WAIT = { type: 'wait' }
const RENDER = { type: 'render' }
const redirect = (to) => ({ type: 'redirect', to })

/**
 * Layout de una ruta: 'app' (sidebar+header) o 'full' (limpio).
 * Equivale al original: AppLayout solo para paths en RUTAS_APP; todo lo demás FullLayout.
 * @param {string} pathname
 * @returns {'app' | 'full'}
 */
export function classifyLayout(pathname) {
  return APP_PATHS.has(pathname.toLowerCase()) ? 'app' : 'full'
}

/**
 * PublicRoute: páginas solo para usuarios NO autenticados (raíz, /auth).
 * @returns {{type:'wait'|'render'|'redirect', to?:string}}
 */
export function evaluatePublicRoute({
  loading, perfilCargado, isRecoveryMode, hasAccessTokenHash,
  user, isCompanyAdmin, onboardingPendiente, featuresDesbloqueadas,
}) {
  if (loading || !perfilCargado) return WAIT
  if (isRecoveryMode || hasAccessTokenHash) return RENDER
  if (user) {
    if (isCompanyAdmin) return redirect('/empresa-admin')
    // Onboarding inicial superado pero sin features → al Gerente de Búsqueda.
    if (!onboardingPendiente && !featuresDesbloqueadas) return redirect('/proyecto-laboral')
    return redirect('/dashboard')
  }
  return RENDER
}

/**
 * OnboardingGuard: corre dentro de PrivateRoute (usuario ya autenticado). Decide si la
 * página renderiza, espera, o redirige según onboarding/gating/rol.
 * @returns {{type:'wait'|'render'|'redirect', to?:string}}
 */
export function evaluateOnboarding({
  loading, pathname, isRecoveryMode, isCompanyAdmin, isAdmin,
  jpLoaded, perfilCargado, onboardingPendiente, featuresDesbloqueadas,
}) {
  if (loading) return WAIT

  const path = pathname.toLowerCase()
  if (isRecoveryMode || path.startsWith('/reset-password')) return RENDER

  // Company admin (HR) / super admin → bypass de guards de usuario; si entran a rutas
  // de usuario común, se les manda a su panel.
  if (isCompanyAdmin || isAdmin) {
    if (path === '/empresa-admin' || path.startsWith('/admin')) return RENDER
    return redirect('/empresa-admin')
  }

  // Rutas que no esperan jpLoaded/perfilCargado (forms en progreso que no deben desmontarse).
  if (SKIP_ONBOARDING_PATHS.has(path)) return RENDER

  if (!jpLoaded || !perfilCargado) return WAIT

  if (onboardingPendiente) return redirect('/bienvenida')

  // Gating de herramientas: features se desbloquean al completar el Gerente al 100%.
  if (GATED_PATHS.has(path) && !featuresDesbloqueadas) return redirect('/proyecto-laboral')

  return RENDER
}

/**
 * BienvenidaRoute: solo accesible autenticado + con onboarding pendiente.
 * @returns {{type:'wait'|'render'|'redirect', to?:string}}
 */
export function evaluateBienvenida({ loading, perfilCargado, user, onboardingPendiente }) {
  if (loading || !perfilCargado) return WAIT
  if (!user) return redirect('/auth')
  if (!onboardingPendiente) return redirect('/dashboard')
  return RENDER
}
