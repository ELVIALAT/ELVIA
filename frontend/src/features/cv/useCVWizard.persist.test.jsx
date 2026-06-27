// @vitest-environment jsdom
//
// Red de seguridad para el refactor hook+context del CV-wizard (Fase 3).
// El byte-diff probó que la lógica de persistencia es IDÉNTICA al original, pero no
// que funcione en runtime. Aquí validamos el comportamiento más delicado —que el
// borrador se restaure desde sessionStorage con la MISMA shape que escribe el autosave:
//   sessionStorage['cv_draft_<user.id>'] = { datos, paso_actual }
// Si un refactor cambiara la clave o la shape, este test falla.
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, render, waitFor } from '@testing-library/react'
import { ESTADO_EMPTY } from './constants'

// ── Mocks de las dependencias del hook (deben ir antes de importarlo) ──
// CLAVE: devolver REFERENCIAS ESTABLES (singletons en el closure del factory). Si
// useAuth devolviera un objeto nuevo por render, `user` cambiaría de referencia y el
// efecto `cargar` (dep [user]) re-dispararía en loop infinito → OOM del worker.
vi.mock('react-router-dom', () => {
  const navigate = () => {}
  const location = { state: null } // sin modoForzado → usa el path de sessionStorage
  return { useNavigate: () => navigate, useLocation: () => location }
})
vi.mock('../../context/AuthContext', () => {
  const auth = { user: { id: 'u1' } }
  return { useAuth: () => auth }
})
vi.mock('../../context/ProfileContext', () => {
  const profile = {
    perfil: null,
    refreshPerfil: () => {},
    refreshJpData: () => {},
  }
  return { useProfile: () => profile }
})
vi.mock('../../context/usePlan', () => {
  const plan = { isPaidPlan: false }
  return { usePlan: () => plan }
})
// supabase: el fetch de perfil devuelve null (sin perfil en BD). El path que importa
// —restaurar desde sessionStorage— corre ANTES del fetch, así que no depende de esto.
vi.mock('../../services/authService', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
      update: () => ({ eq: async () => ({ error: null }) }),
    }),
  },
}))
vi.mock('../../services/cvService', () => ({
  generarCVDesdeCero: vi.fn(), extractarPerfilCV: vi.fn(), descargarCV: vi.fn(),
  optimizarResumenIA: vi.fn(), optimizarExpIA: vi.fn(), fusionarResumenIA: vi.fn(),
}))

import { useCVWizardState } from './useCVWizard'
import CVDesdeCero from '../../pages/CVDesdeCero'

describe('useCVWizard — persistencia del borrador (sessionStorage)', () => {
  beforeEach(() => { sessionStorage.clear() })

  test('restaura datos + paso desde cv_draft_<user.id> al montar', async () => {
    // Shape EXACTA que escribe el autosave/flush del orquestador.
    sessionStorage.setItem('cv_draft_u1', JSON.stringify({
      datos: { ...ESTADO_EMPTY, nombre: 'Ana', apellido: 'Pérez', cargo_objetivo: 'PM' },
      paso_actual: 2,
    }))

    const { result, unmount } = renderHook(() => useCVWizardState())

    await waitFor(() => expect(result.current.inicializando).toBe(false))
    expect(result.current.datos.nombre).toBe('Ana')
    expect(result.current.datos.apellido).toBe('Pérez')
    expect(result.current.datos.cargo_objetivo).toBe('PM')
    expect(result.current.pasoActual).toBe(2)
    unmount()
  })

  test('sin borrador en sessionStorage no rompe y termina de inicializar', async () => {
    const { result, unmount } = renderHook(() => useCVWizardState())
    await waitFor(() => expect(result.current.inicializando).toBe(false))
    // Sin cache ni perfil: arranca en la shape vacía, sin lanzar.
    expect(result.current.datos.nombre).toBe('')
    expect(result.current.pasoActual).toBe(0)
    unmount()
  })

  test('ignora cache vacío (sin nombre y paso 0) — no pisa el flujo con basura', async () => {
    sessionStorage.setItem('cv_draft_u1', JSON.stringify({ datos: { ...ESTADO_EMPTY }, paso_actual: 0 }))
    const { result, unmount } = renderHook(() => useCVWizardState())
    await waitFor(() => expect(result.current.inicializando).toBe(false))
    expect(result.current.pasoActual).toBe(0)
    unmount()
  })
})

describe('CVDesdeCero — smoke de montaje (provider + router cablean en runtime)', () => {
  beforeEach(() => { sessionStorage.clear() })

  test('monta sin lanzar y, tras inicializar, muestra la pantalla de selección', async () => {
    const { container, unmount } = render(<CVDesdeCero />)
    // Sin cache ni perfil → cae en la pantalla de selección de ruta.
    await waitFor(() => expect(container.textContent).toMatch(/Crea tu CV/i))
    unmount()
  })
})
