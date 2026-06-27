// features/career-project/api.test.js
// Red de seguridad de la capa de datos features/career-project/api.js.
//
// Mockea supabase a nivel de módulo (authService) — igual que en cv/api.test.js —
// de forma que el mock siga valiendo aunque el import real venga desde api.js.
import { describe, test, expect, vi, beforeEach } from 'vitest'

// vi.hoisted: el estado mutable que el factory de vi.mock referencia debe hoistearse
// para que esté disponible cuando el mock se inicializa.
const h = vi.hoisted(() => ({ db: {}, calls: {} }))

vi.mock('../../services/authService', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: h.db.cvRow }),
              }),
            }),
          }),
        }),
      }),
    }),
    auth: {
      getSession: async () => ({ data: { session: h.db.session } }),
    },
  },
}))

import { careerProjectApi } from './api'

beforeEach(() => {
  h.db.cvRow = null
  h.db.session = null
})

// ── careerProjectApi.tieneCV ─────────────────────────────────────────────────

describe('careerProjectApi.tieneCV', () => {
  test('devuelve true cuando existe una fila en cv_results', async () => {
    h.db.cvRow = { id: 'cv-abc-123' }
    expect(await careerProjectApi.tieneCV('u1')).toBe(true)
  })

  test('devuelve false cuando no hay fila (maybeSingle devuelve null)', async () => {
    h.db.cvRow = null
    expect(await careerProjectApi.tieneCV('u1')).toBe(false)
  })
})

// ── careerProjectApi.getAccessToken ─────────────────────────────────────────

describe('careerProjectApi.getAccessToken', () => {
  test('devuelve el access_token cuando hay sesión activa', async () => {
    h.db.session = { access_token: 'tok-xyz-789' }
    expect(await careerProjectApi.getAccessToken()).toBe('tok-xyz-789')
  })

  test('devuelve null cuando no hay sesión', async () => {
    h.db.session = null
    expect(await careerProjectApi.getAccessToken()).toBeNull()
  })
})
