// ── CAPTURA SÍNCRONA DE RECUPERACIÓN ANTES DE REACT/SUPABASE ──
const rawHash = window.location.hash;
if (rawHash.includes('type=recovery')) {
  sessionStorage.setItem('optima_recovery_mode', 'true');
  sessionStorage.setItem('optima_recovery_hash', rawHash);
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { AuthProvider } from './context/AuthContext'
import { ProfileProvider } from './context/ProfileContext'
import { TenantProvider } from './context/TenantContext'
import { CVProvider } from './context/CVContext'
import App from './App'
import './index.css'

// PII Shield (Promesa #1): redacta datos personales antes de enviar a Sentry.
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const TOKEN_RE = /\b(eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/g
const redact = (s) => typeof s === 'string'
  ? s.replace(TOKEN_RE, '[REDACTED_TOKEN]').replace(EMAIL_RE, '[REDACTED_EMAIL]')
  : s

function scrubEvent(event) {
  try {
    delete event.user
    if (event.request) {
      delete event.request.data
      if (typeof event.request.url === 'string') event.request.url = redact(event.request.url)
    }
    if (typeof event.message === 'string') event.message = redact(event.message)
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (typeof ex.value === 'string') ex.value = redact(ex.value)
      }
    }
    if (event.breadcrumbs) {
      for (const b of event.breadcrumbs) {
        if (typeof b.message === 'string') b.message = redact(b.message)
        if (b.data && typeof b.data === 'object') delete b.data.body
      }
    }
  } catch {
    return null
  }
  return event
}

// Sentry solo se activa si hay DSN configurado (no en desarrollo sin variable)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    // Muestreo conservador para no agotar cuota gratuita
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    sendDefaultPii: false,
    beforeSend: scrubEvent,
    // Ignora errores de extensiones del browser (no son del producto)
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <TenantProvider>
            <CVProvider>
              <App />
            </CVProvider>
          </TenantProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
