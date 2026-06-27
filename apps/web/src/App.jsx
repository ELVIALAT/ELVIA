import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/common/Header'
import Sidebar from './components/common/Sidebar'
import CookieConsent from './components/common/CookieConsent'
import AiChatBot from './components/chat/AiChatBot'
import ErrorBoundary from './components/common/ErrorBoundary'
import { useAuth } from './context/AuthContext'
import { useProfile } from './context/ProfileContext'
import { Toaster } from 'react-hot-toast'
import { ROUTES } from './routes/registry'
import {
  classifyLayout,
  evaluatePublicRoute,
  evaluateOnboarding,
  evaluateBienvenida,
} from './routes/decisions'

// ResetPassword se importa también aquí (además del registry) para el bloqueo nuclear
// de abajo, que lo renderiza fuera del <Suspense>/<Routes> normal.
const ResetPassword = lazy(() => import('./pages/ResetPassword'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Traduce la decisión pura (routes/decisions.js) a lo que renderiza un guard.
function applyDecision(decision, children) {
  if (decision.type === 'wait') return null
  if (decision.type === 'redirect') return <Navigate to={decision.to} replace />
  return children
}

// Lee el modo recovery de las fuentes side-effectful (sessionStorage + hash + flag).
function useRecoveryMode() {
  const { isRecovering } = useAuth()
  const location = useLocation()
  return sessionStorage.getItem('optima_recovery_mode') === 'true'
    || isRecovering
    || location.hash.includes('type=recovery')
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  const { onboardingPendiente, featuresDesbloqueadas, perfilCargado, isCompanyAdmin } = useProfile()
  const location = useLocation()
  const isRecoveryMode = useRecoveryMode()

  return applyDecision(evaluatePublicRoute({
    loading, perfilCargado, isRecoveryMode,
    hasAccessTokenHash: location.hash.includes('access_token'),
    user, isCompanyAdmin, onboardingPendiente, featuresDesbloqueadas,
  }), children)
}

function OnboardingGuard({ children }) {
  const { loading } = useAuth()
  const { onboardingPendiente, featuresDesbloqueadas, isCompanyAdmin, isAdmin, jpLoaded, perfilCargado } = useProfile()
  const location = useLocation()
  const isRecoveryMode = useRecoveryMode()

  return applyDecision(evaluateOnboarding({
    loading, pathname: location.pathname, isRecoveryMode,
    isCompanyAdmin, isAdmin, jpLoaded, perfilCargado, onboardingPendiente, featuresDesbloqueadas,
  }), children)
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  return <OnboardingGuard>{children}</OnboardingGuard>
}

function BienvenidaRoute({ children }) {
  const { user, loading } = useAuth()
  const { onboardingPendiente, perfilCargado } = useProfile()
  return applyDecision(evaluateBienvenida({ loading, perfilCargado, user, onboardingPendiente }), children)
}

const GUARDS = { public: PublicRoute, private: PrivateRoute, bienvenida: BienvenidaRoute }

// Construye el elemento de una entrada del registry: redirect, o componente (con sus
// props) envuelto en su guard si tiene uno.
function buildElement(route) {
  if (route.redirectTo) return <Navigate to={route.redirectTo} replace />
  const Component = route.Component
  let element = <Component {...(route.props || {})} />
  const Guard = GUARDS[route.guard]
  if (Guard) element = <Guard>{element}</Guard>
  return element
}

// Layout con sidebar para páginas de app
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col min-h-screen md:pl-64">
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 bg-surface">
          {children}
        </main>
      </div>
      <AiChatBot />
    </div>
  )
}

// Layout limpio para Landing, Auth y Onboarding
function FullLayout({ children }) {
  const { user } = useAuth()
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {children}
      {user && <AiChatBot />}
    </div>
  )
}

export default function App() {
  const { isRecovering } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // ── BLOQUEO Y REDIRECCIÓN DE SEGURIDAD (NUCLEAR) ──
  // 1. Si aterrizamos en cualquier parte (?forgot=1, /, etc) con un token de recuperación,
  // forzamos la navegación a la ruta dedicada.
  useEffect(() => {
    const isRecoveryMode = sessionStorage.getItem('optima_recovery_mode') === 'true' || isRecovering || location.hash.includes('type=recovery')
    // /activar pages handle their own recovery tokens (B2B activation flow)
    const isActivacionPath = location.pathname.toLowerCase().endsWith('/activar')
    if (isRecoveryMode && !location.pathname.startsWith('/reset-password') && !isActivacionPath) {
      const savedHash = sessionStorage.getItem('optima_recovery_hash') || ''
      navigate('/reset-password' + (location.hash || savedHash), { replace: true })
    }
  }, [location, navigate, isRecovering])

  // 2. Si ya estamos en la ruta correcta, BLOQUEAR para que nada nos saque.
  if (location.pathname.toLowerCase().startsWith('/reset-password')) {
    return (
      <div className="min-h-screen bg-surface">
        <ResetPassword />
      </div>
    )
  }

  const isFullLayout = classifyLayout(location.pathname) === 'full'

  const routes = (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {ROUTES.map((route) => (
          <Route key={route.path} path={route.path} element={buildElement(route)} />
        ))}
      </Routes>
    </Suspense>
  )

  return (
    <ErrorBoundary>
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#111827',
              color: '#fff',
              border: '1px solid #1f2937',
              borderRadius: '1rem',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif'
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }}
        />
        {isFullLayout ? <FullLayout>{routes}</FullLayout> : <AppLayout>{routes}</AppLayout>}
        <CookieConsent />
      </>
    </ErrorBoundary>
  )
}
