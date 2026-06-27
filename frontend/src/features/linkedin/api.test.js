// features/linkedin/api.test.js
// Red de seguridad directa de linkedinApi: verifica que cada método encapsula
// correctamente el ciclo getSession → fetch → json sin exponer supabase al hook.
//
// Mock de supabase via vi.mock('../../services/authService') — mismo patrón que
// features/cv/api.test.js. Mock de fetch global con vi.fn().
import { describe, test, expect, vi, beforeEach } from 'vitest'

// vi.hoisted: estado mutable accesible dentro del factory de vi.mock.
const h = vi.hoisted(() => ({
  token: 'test-token-abc',
  fetchResponses: [], // cola FIFO de { ok, body } consumida por fetch mock
}))

vi.mock('../../services/authService', () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: { access_token: h.token } },
      }),
    },
  },
}))

// Mock de fetch global — cada llamada consume el primer elemento de la cola.
const mockFetch = vi.fn(async () => {
  const next = h.fetchResponses.shift()
  if (!next) throw new Error('fetch mock: sin respuesta en cola')
  return {
    ok: next.ok,
    json: async () => next.body,
  }
})
vi.stubGlobal('fetch', mockFetch)

import { linkedinApi } from './api'

beforeEach(() => {
  h.token = 'test-token-abc'
  h.fetchResponses = []
  mockFetch.mockClear()
})

// ── getAccessToken ────────────────────────────────────────────────────────────

describe('linkedinApi.getAccessToken', () => {
  test('devuelve el token de la sesión activa', async () => {
    const token = await linkedinApi.getAccessToken()
    expect(token).toBe('test-token-abc')
  })

  test('devuelve null cuando no hay sesión', async () => {
    h.token = undefined
    const token = await linkedinApi.getAccessToken()
    expect(token).toBeNull()
  })
})

// ── cargarDatos ───────────────────────────────────────────────────────────────

describe('linkedinApi.cargarDatos', () => {
  test('hace 3 fetches en paralelo y mapea los resultados correctamente', async () => {
    const historialData = [{ id: '1', puntaje_global: 80 }]
    const usoData = { usados: 2, restantes: 8, limite: 10, fecha_reset: null }
    const analisisData = { original: { titular: 'Ingeniero Senior' }, created_at: '2026-06-25T00:00:00Z' }

    h.fetchResponses.push(
      { ok: true, body: historialData },
      { ok: true, body: usoData },
      { ok: true, body: analisisData },
    )

    const result = await linkedinApi.cargarDatos()

    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(result.historial).toEqual(historialData)
    expect(result.usoMes).toEqual(usoData)
    // analisisPrevio se establece porque a.original tiene texto
    expect(result.analisisPrevio).toEqual(analisisData)
  })

  test('devuelve defaults vacíos cuando los 3 fetches fallan (no lanza)', async () => {
    h.fetchResponses.push(
      { ok: false, body: {} },
      { ok: false, body: {} },
      { ok: false, body: {} },
    )

    const result = await linkedinApi.cargarDatos()

    expect(result.historial).toEqual([])
    expect(result.usoMes).toEqual({ usados: 0, restantes: 10, limite: 10, fecha_reset: null })
    expect(result.analisisPrevio).toBeNull()
  })

  test('analisisPrevio es null cuando ultimo-analisis devuelve objeto sin original con texto', async () => {
    h.fetchResponses.push(
      { ok: true, body: [] },
      { ok: true, body: { usados: 0, restantes: 10, limite: 10, fecha_reset: null } },
      { ok: true, body: { original: { titular: '' }, created_at: '2026-06-25T00:00:00Z' } },
    )

    const result = await linkedinApi.cargarDatos()
    // titular está vacío → ningún valor tiene texto → analisisPrevio debe ser null
    expect(result.analisisPrevio).toBeNull()
  })

  test('envía el Bearer token en los headers', async () => {
    h.fetchResponses.push(
      { ok: true, body: [] },
      { ok: true, body: {} },
      { ok: true, body: {} },
    )

    await linkedinApi.cargarDatos()

    const calls = mockFetch.mock.calls
    expect(calls.length).toBe(3)
    calls.forEach(([_url, opts]) => {
      expect(opts.headers).toMatchObject({ Authorization: 'Bearer test-token-abc' })
    })
  })
})

// ── analizar ──────────────────────────────────────────────────────────────────

describe('linkedinApi.analizar', () => {
  test('POST a /api/linkedin/analizar con los campos y devuelve { ok, data }', async () => {
    const responseData = { puntaje_global: 75, secciones: {} }
    h.fetchResponses.push({ ok: true, body: responseData })

    const campos = { titular: 'Dev', extracto: 'Texto', experiencia: '', habilidades: '', idiomas: '', educacion: '' }
    const result = await linkedinApi.analizar({ campos, contextoLaboral: { area: 'Tech' } })

    expect(result.ok).toBe(true)
    expect(result.data).toEqual(responseData)

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/linkedin/analizar')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toMatchObject({ ...campos, contextoLaboral: { area: 'Tech' } })
    expect(opts.headers).toMatchObject({ Authorization: 'Bearer test-token-abc', 'Content-Type': 'application/json' })
  })

  test('devuelve { ok: false, error } cuando el servidor responde con error', async () => {
    h.fetchResponses.push({ ok: false, body: { error: 'Límite mensual alcanzado' } })

    const result = await linkedinApi.analizar({ campos: {}, contextoLaboral: null })

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Límite mensual alcanzado')
    expect(result.data).toBeNull()
  })
})

// ── generateAnalysis ──────────────────────────────────────────────────────────

describe('linkedinApi.generateAnalysis', () => {
  test('POST a /api/linkedin/generate-analysis y devuelve { ok, data }', async () => {
    const responseData = { informe: 'texto detallado' }
    h.fetchResponses.push({ ok: true, body: responseData })

    const result = await linkedinApi.generateAnalysis({ campos: { titular: 'Dev' }, contextoLaboral: null })

    expect(result.ok).toBe(true)
    expect(result.data).toEqual(responseData)
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/linkedin/generate-analysis')
  })

  test('devuelve { ok: false, error } cuando el servidor falla', async () => {
    h.fetchResponses.push({ ok: false, body: { error: 'Error interno' } })

    const result = await linkedinApi.generateAnalysis({ campos: {}, contextoLaboral: null })

    expect(result.ok).toBe(false)
    expect(result.error).toBe('Error interno')
  })
})

// ── extraerPDF ────────────────────────────────────────────────────────────────

describe('linkedinApi.extraerPDF', () => {
  test('POST a /api/linkedin/extraer-pdf con FormData y devuelve { ok, data }', async () => {
    const campos = { titular: 'Ingeniero', extracto: '', experiencia: '', habilidades: '', idiomas: '', educacion: '' }
    h.fetchResponses.push({ ok: true, body: campos })

    const file = new File(['contenido'], 'perfil.pdf', { type: 'application/pdf' })
    const result = await linkedinApi.extraerPDF(file)

    expect(result.ok).toBe(true)
    expect(result.data).toEqual(campos)

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/linkedin/extraer-pdf')
    expect(opts.method).toBe('POST')
    expect(opts.body).toBeInstanceOf(FormData)
  })

  test('devuelve { ok: false, error } con el mensaje del backend cuando falla', async () => {
    h.fetchResponses.push({ ok: false, body: { error: 'PDF no corresponde a LinkedIn' } })

    const file = new File(['x'], 'otro.pdf', { type: 'application/pdf' })
    const result = await linkedinApi.extraerPDF(file)

    expect(result.ok).toBe(false)
    expect(result.error).toBe('PDF no corresponde a LinkedIn')
  })
})

// ── guardarReporte ────────────────────────────────────────────────────────────

describe('linkedinApi.guardarReporte', () => {
  test('POST a /api/linkedin/guardar-reporte con el payload correcto', async () => {
    h.fetchResponses.push({ ok: true, body: { saved: true } })

    await linkedinApi.guardarReporte({
      analisis: { puntaje_global: 80 },
      editables: { titular: 'Dev' },
      original: { titular: 'Old' },
      filename: 'Analisis LinkedIn 2026-06-26',
    })

    const [url, opts] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/linkedin/guardar-reporte')
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body)).toMatchObject({
      analisis: { puntaje_global: 80 },
      filename: 'Analisis LinkedIn 2026-06-26',
    })
    expect(opts.headers).toMatchObject({ Authorization: 'Bearer test-token-abc' })
  })

  test('NO lanza cuando no hay token (sin sesión)', async () => {
    h.token = undefined
    // No hay fetch en cola — si fetch se llamara lanzaría; el método debe retornar sin llamar fetch
    await expect(linkedinApi.guardarReporte({ analisis: {}, editables: {}, original: {}, filename: 'x' })).resolves.toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
