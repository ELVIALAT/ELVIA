// @vitest-environment jsdom
//
// Smoke de montaje de las pantallas refactorizadas con hook+context (Fase 3).
// Prueba que el Provider + router + primera pantalla CABLEAN y RENDERIZAN en runtime
// (lo que el byte-diff y los static checks no cubren). NO valida lógica de negocio:
// solo que montar no lanza y aparece la UI esperada.
//
// Mocks superset estables (singletons — un objeto nuevo por render haría que `user`
// cambie de referencia y los efectos con dep [user] entren en loop infinito → OOM).
// Cero llamadas reales: supabase/api/fetch mockeados → no toca Claude, email ni BD.
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'

// ── Auth / router / tenant / labels ──
vi.mock('react-router-dom', () => {
  const navigate = () => {}
  const location = { state: null, pathname: '/', search: '' }
  const Link = ({ children }) => children
  return { useNavigate: () => navigate, useLocation: () => location, Link }
})
vi.mock('../context/AuthContext', () => {
  const auth = {
    user: { id: 'u1', email: 'u1@test.com' },
    session: { access_token: 'tok' },
    perfil: { role: 'company_admin', nombre1: 'Ana' },
    jpData: {},
    featuresDesbloqueadas: true,
    loading: false,
    isPaidPlan: false,
    onboardingPendiente: false,
    logout: () => {},
    refreshPerfil: () => {},
    refreshJpData: () => {},
  }
  return { useAuth: () => auth }
})
vi.mock('../context/TenantContext', () => {
  const tenant = { name: 'TestCo', slug: 'test', primary_color: '#0a3', secondary_color: '#137', logo_url: null }
  return { useTenant: () => ({ tenant, cohort: 'cohorte-1' }), DEFAULT_TENANT: { primary_color: '#0a3', secondary_color: '#137' } }
})
vi.mock('../hooks/useSectorLabels', () => {
  // Proxy: cualquier L.xxx devuelve 'xxx' (suficiente para renderizar labels).
  const L = new Proxy({}, { get: (_, k) => (typeof k === 'string' ? k : '') })
  return { useSectorLabels: () => L }
})
vi.mock('../hooks/useTrackEvent', () => ({ useTrackEvent: () => () => {} }))

// ── Servicios: supabase chainable + api + (fetch global más abajo) ──
function chainable(resolved = { data: [], error: null, count: 0 }) {
  const obj = {
    select: () => obj, eq: () => obj, in: () => obj, order: () => obj, limit: () => obj,
    range: () => obj, gt: () => obj, lt: () => obj, ilike: () => obj, neq: () => obj,
    update: () => obj, insert: () => obj, upsert: () => obj, delete: () => obj,
    single: async () => ({ data: {}, error: null }),
    maybeSingle: async () => ({ data: {}, error: null }),
    then: (resolve) => resolve(resolved),
  }
  return obj
}
vi.mock('../services/authService', () => ({
  supabase: {
    from: () => chainable(),
    auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) },
    storage: { from: () => ({ upload: async () => ({ data: { path: 'x' }, error: null }) }) },
  },
}))
vi.mock('../services/api', () => ({ api: { post: async () => ({}), get: async () => ({}) } }))
// LinkedIn: desbloqueado por progreso (gate FeatureLocked usa calcularProgreso >= 100).
vi.mock('../utils/progresoLaboral', async (orig) => {
  const real = await orig()
  return { ...real, calcularProgreso: () => 100 }
})

// fetch global (CompanyAdmin.fetchAll y LinkedIn cargan por fetch). Un payload superset
// cubre todos los endpoints: cada uno lee su propia clave.
beforeEach(() => {
  sessionStorage.clear()
  global.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({
      company: { name: 'TestCo', slug: 'test', is_active: true },
      users: [], invitations: [], stats: {}, allowlist: [],
      // linkedin
      historial: [], usados: 0, restantes: 10, limite: 10,
    }),
  }))
})

import Entrevista from './Entrevista'
import CompanyAdmin from './CompanyAdmin'
import LinkedinPro from './LinkedinPro'
import ProyectoLaboral from './ProyectoLaboral'

describe('Smoke de montaje — pantallas refactorizadas (hook+context)', () => {
  test('Entrevista monta y muestra el simulador (gate desbloqueado → setup)', async () => {
    const { container, unmount } = render(<Entrevista />)
    await waitFor(() => expect(container.textContent).toMatch(/Simulador de Entrevista|Configurar Simulación/i))
    unmount()
  })

  test('CompanyAdmin monta y muestra el panel HR (tras fetch de company)', async () => {
    const { container, unmount } = render(<CompanyAdmin />)
    await waitFor(() => expect(container.textContent).toMatch(/Panel HR|Programa|Resumen/i))
    unmount()
  })

  test('LinkedinPro monta (gate desbloqueado → formulario)', async () => {
    const { container, unmount } = render(<LinkedinPro />)
    await waitFor(() => expect(container.textContent).toMatch(/LinkedIn/i))
    unmount()
  })

  // ProyectoLaboral fue split de pilares (sin context), pero montar el orquestador
  // valida que los pilares extraídos siguen renderizando.
  test('ProyectoLaboral monta y muestra el Gerente (pilares extraídos renderizan)', async () => {
    const { container, unmount } = render(<ProyectoLaboral />)
    await waitFor(() => expect(container.textContent).toMatch(/Mi Perfil|Competencias|Gerente/i))
    unmount()
  })
})
