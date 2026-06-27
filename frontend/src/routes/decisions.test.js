// Red de seguridad de la lógica de ruteo (el límite de auth/onboarding/gating).
// Congela el comportamiento de los guards ANTES y DESPUÉS del colapso de las 5 listas
// en el registry único, para que cualquier regresión del refactor se cace aquí.
import { describe, test, expect } from 'vitest'
import {
  classifyLayout,
  evaluatePublicRoute,
  evaluateOnboarding,
  evaluateBienvenida,
} from './decisions'
import { APP_PATHS, GATED_PATHS, SKIP_ONBOARDING_PATHS } from './registry'

// Estado base: usuario normal, todo cargado, sin onboarding, sin recovery.
const baseOnb = {
  loading: false, pathname: '/dashboard', isRecoveryMode: false,
  isCompanyAdmin: false, isAdmin: false, jpLoaded: true, perfilCargado: true,
  onboardingPendiente: false, featuresDesbloqueadas: true,
}
const basePublic = {
  loading: false, perfilCargado: true, isRecoveryMode: false, hasAccessTokenHash: false,
  user: null, isCompanyAdmin: false, onboardingPendiente: false, featuresDesbloqueadas: false,
}

describe('classifyLayout', () => {
  test('paths de app → app (con sidebar)', () => {
    for (const p of ['/dashboard', '/cv-optimizer', '/proyecto-laboral', '/perfil', '/ayuda']) {
      expect(classifyLayout(p)).toBe('app')
    }
  })
  test('paths full → full', () => {
    for (const p of ['/', '/auth', '/empresa-admin', '/admin', '/privacidad', '/reset-password']) {
      expect(classifyLayout(p)).toBe('full')
    }
  })
  test('rutas dinámicas y desconocidas → full', () => {
    expect(classifyLayout('/empresas/acme')).toBe('full')
    expect(classifyLayout('/reporte-visual/123')).toBe('full')
    expect(classifyLayout('/ruta-inexistente')).toBe('full')
  })
  test('es case-insensitive (como el original .toLowerCase())', () => {
    expect(classifyLayout('/Dashboard')).toBe('app')
  })
})

describe('evaluatePublicRoute', () => {
  test('cargando o perfil no cargado → wait', () => {
    expect(evaluatePublicRoute({ ...basePublic, loading: true })).toEqual({ type: 'wait' })
    expect(evaluatePublicRoute({ ...basePublic, perfilCargado: false })).toEqual({ type: 'wait' })
  })
  test('recovery mode o hash con access_token → render (deja pasar)', () => {
    expect(evaluatePublicRoute({ ...basePublic, isRecoveryMode: true })).toEqual({ type: 'render' })
    expect(evaluatePublicRoute({ ...basePublic, hasAccessTokenHash: true })).toEqual({ type: 'render' })
  })
  test('no autenticado → render', () => {
    expect(evaluatePublicRoute(basePublic)).toEqual({ type: 'render' })
  })
  test('company admin autenticado → /empresa-admin', () => {
    expect(evaluatePublicRoute({ ...basePublic, user: { id: 'u' }, isCompanyAdmin: true }))
      .toEqual({ type: 'redirect', to: '/empresa-admin' })
  })
  test('usuario sin onboarding pendiente y sin features → /proyecto-laboral', () => {
    expect(evaluatePublicRoute({ ...basePublic, user: { id: 'u' }, onboardingPendiente: false, featuresDesbloqueadas: false }))
      .toEqual({ type: 'redirect', to: '/proyecto-laboral' })
  })
  test('usuario con features desbloqueadas → /dashboard', () => {
    expect(evaluatePublicRoute({ ...basePublic, user: { id: 'u' }, featuresDesbloqueadas: true }))
      .toEqual({ type: 'redirect', to: '/dashboard' })
  })
  test('usuario con onboarding pendiente → /dashboard (PrivateRoute lo encamina luego)', () => {
    expect(evaluatePublicRoute({ ...basePublic, user: { id: 'u' }, onboardingPendiente: true, featuresDesbloqueadas: false }))
      .toEqual({ type: 'redirect', to: '/dashboard' })
  })
})

describe('evaluateOnboarding', () => {
  test('cargando → wait', () => {
    expect(evaluateOnboarding({ ...baseOnb, loading: true })).toEqual({ type: 'wait' })
  })
  test('recovery mode o /reset-password → render', () => {
    expect(evaluateOnboarding({ ...baseOnb, isRecoveryMode: true })).toEqual({ type: 'render' })
    expect(evaluateOnboarding({ ...baseOnb, pathname: '/reset-password' })).toEqual({ type: 'render' })
  })
  test('admin/HR en su panel o /admin → render', () => {
    expect(evaluateOnboarding({ ...baseOnb, isCompanyAdmin: true, pathname: '/empresa-admin' })).toEqual({ type: 'render' })
    expect(evaluateOnboarding({ ...baseOnb, isAdmin: true, pathname: '/admin' })).toEqual({ type: 'render' })
  })
  test('admin/HR en ruta de usuario → /empresa-admin', () => {
    expect(evaluateOnboarding({ ...baseOnb, isCompanyAdmin: true, pathname: '/dashboard' }))
      .toEqual({ type: 'redirect', to: '/empresa-admin' })
  })
  test('ruta skip (form en progreso) → render sin esperar carga', () => {
    expect(evaluateOnboarding({ ...baseOnb, pathname: '/proyecto-laboral', jpLoaded: false, perfilCargado: false }))
      .toEqual({ type: 'render' })
    expect(evaluateOnboarding({ ...baseOnb, pathname: '/cv-desde-cero', jpLoaded: false }))
      .toEqual({ type: 'render' })
  })
  test('jp/perfil no cargados (ruta no-skip) → wait', () => {
    expect(evaluateOnboarding({ ...baseOnb, jpLoaded: false })).toEqual({ type: 'wait' })
    expect(evaluateOnboarding({ ...baseOnb, perfilCargado: false })).toEqual({ type: 'wait' })
  })
  test('onboarding pendiente → /bienvenida', () => {
    expect(evaluateOnboarding({ ...baseOnb, onboardingPendiente: true }))
      .toEqual({ type: 'redirect', to: '/bienvenida' })
  })
  test('herramienta gated sin features → /proyecto-laboral', () => {
    expect(evaluateOnboarding({ ...baseOnb, pathname: '/jobs', featuresDesbloqueadas: false }))
      .toEqual({ type: 'redirect', to: '/proyecto-laboral' })
  })
  test('herramienta gated con features → render', () => {
    expect(evaluateOnboarding({ ...baseOnb, pathname: '/jobs', featuresDesbloqueadas: true }))
      .toEqual({ type: 'render' })
  })
  test('/linkedin-pro: skip tiene precedencia sobre gated (render aunque esté locked)', () => {
    expect(evaluateOnboarding({ ...baseOnb, pathname: '/linkedin-pro', featuresDesbloqueadas: false }))
      .toEqual({ type: 'render' })
  })
  test('ruta no gated y no skip (ej. /perfil) sin features → render', () => {
    expect(evaluateOnboarding({ ...baseOnb, pathname: '/perfil', featuresDesbloqueadas: false }))
      .toEqual({ type: 'render' })
  })
})

describe('evaluateBienvenida', () => {
  test('cargando o perfil no cargado → wait', () => {
    expect(evaluateBienvenida({ loading: true, perfilCargado: true, user: { id: 'u' }, onboardingPendiente: true }))
      .toEqual({ type: 'wait' })
    expect(evaluateBienvenida({ loading: false, perfilCargado: false, user: { id: 'u' }, onboardingPendiente: true }))
      .toEqual({ type: 'wait' })
  })
  test('no autenticado → /auth', () => {
    expect(evaluateBienvenida({ loading: false, perfilCargado: true, user: null, onboardingPendiente: true }))
      .toEqual({ type: 'redirect', to: '/auth' })
  })
  test('sin onboarding pendiente → /dashboard', () => {
    expect(evaluateBienvenida({ loading: false, perfilCargado: true, user: { id: 'u' }, onboardingPendiente: false }))
      .toEqual({ type: 'redirect', to: '/dashboard' })
  })
  test('autenticado con onboarding pendiente → render', () => {
    expect(evaluateBienvenida({ loading: false, perfilCargado: true, user: { id: 'u' }, onboardingPendiente: true }))
      .toEqual({ type: 'render' })
  })
})

// Locks de consistencia: el registry debe derivar EXACTAMENTE los conjuntos que antes
// eran arrays hardcodeados en App.jsx. Si alguien agrega/quita una ruta y rompe un set,
// esto lo caza.
describe('conjuntos derivados del registry', () => {
  test('APP_PATHS = las 19 rutas de app del original (RUTAS_APP)', () => {
    expect([...APP_PATHS].sort()).toEqual([
      '/ayuda', '/biblioteca', '/bienestar', '/cv-desde-cero', '/cv-optimizer', '/cv-vs-job',
      '/dashboard', '/entrevista', '/expertos', '/infografias', '/jobs', '/linkedin-pro',
      '/mis-cvs', '/mis-metricas', '/mis-vacantes', '/onboarding', '/perfil', '/pipeline',
      '/proyecto-laboral',
    ])
  })
  test('GATED_PATHS = las 11 herramientas gateadas del original (RUTAS_GATED)', () => {
    expect([...GATED_PATHS].sort()).toEqual([
      '/biblioteca', '/cv-optimizer', '/cv-vs-job', '/dashboard', '/entrevista', '/jobs',
      '/linkedin-pro', '/mis-cvs', '/mis-metricas', '/mis-vacantes', '/pipeline',
    ])
  })
  test('SKIP_ONBOARDING_PATHS cubre las rutas privadas que el original eximía del guard', () => {
    for (const p of ['/empresa-admin', '/proyecto-laboral', '/cv-desde-cero', '/linkedin-pro']) {
      expect(SKIP_ONBOARDING_PATHS.has(p)).toBe(true)
    }
  })
})
