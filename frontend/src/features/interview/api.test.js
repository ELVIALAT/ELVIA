// Red de seguridad DIRECTA de la capa de datos features/interview/api.js.
//
// Protege los 3 métodos públicos: getCvBase, getVacantesYChecks y getAccessToken.
// Usa el mismo patrón vi.hoisted + mock programable que features/cv/api.test.js:
// el factory de vi.mock referencia h (hoisted), cada test configura h.db.* antes
// de llamar a la función y verifica la salida del método, no la de supabase.
import { describe, test, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  db: {
    cvResults: null,    // respuesta de cv_results
    savedJobs: null,    // respuesta de saved_jobs
    jobChecks: null,    // respuesta de job_checks
    session: null,      // respuesta de auth.getSession
    cvResultsError: null,
    savedJobsError: null,
    jobChecksError: null,
  },
}))

vi.mock('../../services/authService', () => ({
  supabase: {
    from: (table) => {
      if (table === 'cv_results') {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({
                order: () => ({
                  limit: async () => ({ data: h.db.cvResults, error: h.db.cvResultsError }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'saved_jobs') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({ data: h.db.savedJobs, error: h.db.savedJobsError }),
            }),
          }),
        }
      }
      if (table === 'job_checks') {
        return {
          select: () => ({
            eq: async () => ({ data: h.db.jobChecks, error: h.db.jobChecksError }),
          }),
        }
      }
      return {}
    },
    auth: {
      getSession: async () => ({ data: { session: h.db.session } }),
    },
  },
}))

import { entrevistaApi } from './api'

beforeEach(() => {
  h.db.cvResults = null
  h.db.savedJobs = null
  h.db.jobChecks = null
  h.db.session = null
  h.db.cvResultsError = null
  h.db.savedJobsError = null
  h.db.jobChecksError = null
})

// ── getCvBase ─────────────────────────────────────────────────────────────────

describe('entrevistaApi.getCvBase', () => {
  test('devuelve el array de filas cuando hay resultados', async () => {
    h.db.cvResults = [
      { id: '1', contenido: '{"cv_text":"hola"}', tipo: 'optimize', metadata: null },
      { id: '2', contenido: '{}',                  tipo: 'original',  metadata: null },
    ]
    const { data } = await entrevistaApi.getCvBase('u1')
    expect(data).toHaveLength(2)
    expect(data[0].id).toBe('1')
  })

  test('devuelve [] cuando la query no retorna datos (null)', async () => {
    h.db.cvResults = null
    const { data } = await entrevistaApi.getCvBase('u1')
    expect(data).toEqual([])
  })

  test('devuelve [] inmediatamente si userId es falsy (sin tocar supabase)', async () => {
    // Si supabase fuera llamado con userId null reventaría el mock: el test mismo actúa
    // como barrera — si la función no cortocircuita, la query colgada haría fallar el test.
    h.db.cvResults = [{ id: '9' }]
    const { data } = await entrevistaApi.getCvBase(null)
    expect(data).toEqual([])
  })
})

// ── getVacantesYChecks ────────────────────────────────────────────────────────

describe('entrevistaApi.getVacantesYChecks', () => {
  test('devuelve saved y checks cuando ambas queries tienen datos', async () => {
    h.db.savedJobs = [{ id: 'j1', job_data: { title: 'Dev' }, job_key: 'k1' }]
    h.db.jobChecks = [{ job_key: 'k1', score: 85 }]
    const { saved, checks } = await entrevistaApi.getVacantesYChecks('u1')
    expect(saved).toHaveLength(1)
    expect(saved[0].id).toBe('j1')
    expect(checks).toHaveLength(1)
    expect(checks[0].score).toBe(85)
  })

  test('devuelve arrays vacíos para la query que falla (null)', async () => {
    h.db.savedJobs = null   // simula fallo o sin datos
    h.db.jobChecks = [{ job_key: 'k1', score: 80 }]
    const { saved, checks } = await entrevistaApi.getVacantesYChecks('u1')
    expect(saved).toEqual([])
    expect(checks).toHaveLength(1)
  })

  test('devuelve { saved: [], checks: [] } si userId es falsy', async () => {
    h.db.savedJobs = [{ id: 'j1' }]
    h.db.jobChecks = [{ job_key: 'k1', score: 90 }]
    const result = await entrevistaApi.getVacantesYChecks(undefined)
    expect(result).toEqual({ saved: [], checks: [] })
  })
})

// ── getAccessToken ────────────────────────────────────────────────────────────

describe('entrevistaApi.getAccessToken', () => {
  test('devuelve el access_token cuando hay sesión activa', async () => {
    h.db.session = { access_token: 'tok-abc123', user: { id: 'u1' } }
    const token = await entrevistaApi.getAccessToken()
    expect(token).toBe('tok-abc123')
  })

  test('devuelve null cuando no hay sesión', async () => {
    h.db.session = null
    const token = await entrevistaApi.getAccessToken()
    expect(token).toBeNull()
  })

  test('devuelve null cuando la sesión existe pero access_token está ausente', async () => {
    h.db.session = { user: { id: 'u1' } } // sin access_token
    const token = await entrevistaApi.getAccessToken()
    expect(token).toBeNull()
  })
})
