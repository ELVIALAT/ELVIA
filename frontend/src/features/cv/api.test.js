// Red de seguridad DIRECTA de la capa de datos features/cv/api.js.
//
// El persist.test prueba el hook de forma transitiva y su mock de supabase devuelve
// { data: null } — así que el read-modify-write real (mergear cv_borrador SIN pisar el
// resto del job_search_profile) y todo el payload de saveGeneratedCV NUNCA se ejecutan
// ahí. Este archivo cierra ese hueco: usa un mock PROGRAMABLE que (a) controla qué jsp
// existe en BD y (b) CAPTURA el payload que se manda al update, para assertar el merge.
//
// Invariante central que protege: "no corromper el resto del job_search_profile al
// escribir" — el activo más caro del usuario (su CV/perfil) vive ahí.
import { describe, test, expect, vi, beforeEach } from 'vitest'

// vi.hoisted: el estado mutable que el factory de vi.mock referencia debe hoistearse
// junto al mock (si fuera un `const` normal, el factory lo tocaría antes de inicializarlo).
const h = vi.hoisted(() => ({ db: {}, calls: {} }))

vi.mock('../../services/authService', () => ({
  supabase: {
    from: () => ({
      // select(...).eq(...).maybeSingle() → { data: <lo que configure el test> }
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: h.db.selectData }) }) }),
      // update(payload).eq('id', userId) → captura payload + id, resuelve { error }
      update: (payload) => {
        h.calls.updatePayload = payload
        return { eq: async (col, id) => { h.calls.eqCol = col; h.calls.eqId = id; return { error: h.db.updateError } } }
      },
    }),
    storage: {
      from: () => ({
        upload: async (path, blob, opts) => {
          h.calls.uploadArgs = { path, blob, opts }
          return h.db.uploadResult
        },
      }),
    },
  },
}))

import { cvApi } from './api'

beforeEach(() => {
  h.db.selectData = null
  h.db.updateError = null
  h.db.uploadResult = { data: { path: 'u1/cv_original.txt' }, error: null }
  h.calls.updatePayload = null
  h.calls.uploadArgs = null
  h.calls.eqId = null
  h.calls.eqCol = null
})

describe('cvApi.getProfile', () => {
  test('devuelve la fila cuando existe', async () => {
    h.db.selectData = { id: 'u1', job_search_profile: { oferta: { x: 1 } } }
    expect(await cvApi.getProfile('u1')).toEqual({ id: 'u1', job_search_profile: { oferta: { x: 1 } } })
  })

  test('devuelve null cuando no hay fila (o el select falla)', async () => {
    h.db.selectData = null
    expect(await cvApi.getProfile('u1')).toBeNull()
  })
})

describe('cvApi.saveDraft', () => {
  test('mergea cv_borrador SIN pisar las demás llaves del jsp', async () => {
    h.db.selectData = {
      job_search_profile: {
        oferta:          { oferta_valor: 'soy crack' },
        autoconocimiento: { hard_skills: ['SQL'] },
        cv_borrador:      { paso_actual: 0, datos: { nombre: 'viejo' } }, // será sobreescrito
      },
    }

    const res = await cvApi.saveDraft('u1', { pasoActual: 3, datos: { nombre: 'Ana' } })

    expect(res).toEqual({ ok: true })
    const jsp = h.calls.updatePayload.job_search_profile
    // Hermanos intactos (el bug clásico: que el spread los borre)
    expect(jsp.oferta).toEqual({ oferta_valor: 'soy crack' })
    expect(jsp.autoconocimiento).toEqual({ hard_skills: ['SQL'] })
    // cv_borrador sobreescrito con los datos nuevos
    expect(jsp.cv_borrador.paso_actual).toBe(3)
    expect(jsp.cv_borrador.datos).toEqual({ nombre: 'Ana' })
    expect(typeof jsp.cv_borrador.ultimo_guardado).toBe('string')
    expect(jsp.cv_borrador.ultimo_guardado).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(h.calls.eqId).toBe('u1')
  })

  test('{ ok: false } y NO escribe cuando no hay perfil', async () => {
    h.db.selectData = null
    const res = await cvApi.saveDraft('u1', { pasoActual: 1, datos: {} })
    expect(res).toEqual({ ok: false })
    expect(h.calls.updatePayload).toBeNull() // probó el early-return: el update jamás corrió
  })

  test('{ ok: false } cuando el update devuelve error', async () => {
    h.db.selectData = { job_search_profile: {} }
    h.db.updateError = { message: 'boom' }
    const res = await cvApi.saveDraft('u1', { pasoActual: 1, datos: {} })
    expect(res).toEqual({ ok: false })
  })

  // Boundary: la fila profiles existe pero job_search_profile es null/undefined.
  // Ejerce el `|| {}` de api.js — sin él, `{ ...null }`/`{ ...undefined }` rompería el merge.
  test('jsp ausente (fila sin job_search_profile) → payload limpio, ok:true, sin lanzar', async () => {
    h.db.selectData = {} // fila sin la llave job_search_profile
    const res = await cvApi.saveDraft('u1', { pasoActual: 1, datos: { nombre: 'Ana' } })
    expect(res).toEqual({ ok: true })
    const jsp = h.calls.updatePayload.job_search_profile
    expect(jsp.cv_borrador.paso_actual).toBe(1)
    expect(jsp.cv_borrador.datos).toEqual({ nombre: 'Ana' })
    expect(Object.keys(jsp)).toEqual(['cv_borrador']) // nada espurio
  })
})

describe('cvApi.discardDraft', () => {
  test('persiste el jsp saneado tal cual lo recibe', async () => {
    const newJsp = { oferta: { x: 1 }, autoconocimiento: { y: 2 } } // ya sin cv_borrador
    await cvApi.discardDraft('u1', newJsp)
    expect(h.calls.updatePayload).toEqual({ job_search_profile: newJsp })
    expect(h.calls.eqId).toBe('u1')
  })

  // Contrato que el JSDoc promete y del que depende descartarYEmpezar: NO lanza aunque
  // el update falle a nivel DB (supabase devuelve { error }, aquí se ignora).
  test('NO lanza aunque el update devuelva error', async () => {
    h.db.updateError = { message: 'boom' }
    await expect(cvApi.discardDraft('u1', { oferta: { x: 1 } })).resolves.toBeUndefined()
  })
})

describe('cvApi.saveGeneratedCV', () => {
  const blob = { sentinel: true } // el mock no lo inspecciona; solo verificamos que se pasa

  test('sube a Storage y persiste el payload correcto, limpiando cv_borrador', async () => {
    h.db.selectData = {
      job_search_profile: {
        oferta:      { oferta_valor: 'crack' },
        cv_borrador: { paso_actual: 5, datos: { stale: true } }, // DEBE desaparecer
        optimizer:   { algo_previo: true },
      },
    }

    // El path que DEVUELVE Storage es distinto al filePath enviado, para atar cv_path a
    // up.path (el de Storage) y no al de entrada — una regresión cv_path:filePath cae aquí.
    h.db.uploadResult = { data: { path: 'u1/normalizado-por-storage.txt' }, error: null }

    const path = await cvApi.saveGeneratedCV('u1', {
      blob, filePath: 'u1/cv_original.txt', nombreArchivo: 'CV Ana.txt', datos: { nombre: 'Ana' },
    })

    // Storage: se sube al filePath de entrada
    expect(h.calls.uploadArgs.path).toBe('u1/cv_original.txt')
    expect(h.calls.uploadArgs.blob).toBe(blob)
    expect(h.calls.uploadArgs.opts).toEqual({ upsert: true })

    // Columnas top-level: cv_path = el path que DEVOLVIÓ Storage, NO el filePath enviado
    const payload = h.calls.updatePayload
    expect(payload.cv_path).toBe('u1/normalizado-por-storage.txt')
    expect(payload.cv_filename).toBe('CV Ana.txt')

    // El update apunta a la fila correcta por la columna correcta (la escritura más destructiva)
    expect(h.calls.eqCol).toBe('id')
    expect(h.calls.eqId).toBe('u1')

    // job_search_profile: hermano preservado, cv_borrador STRIPPEADO, optimizer mergeado
    const jsp = payload.job_search_profile
    expect(jsp.oferta).toEqual({ oferta_valor: 'crack' })
    expect(jsp).not.toHaveProperty('cv_borrador')
    expect(jsp.optimizer).toEqual({ algo_previo: true, cv_generado: true })
    expect(jsp.cv_datos_originales.datos).toEqual({ nombre: 'Ana' })
    expect(typeof jsp.cv_datos_originales.generado_en).toBe('string')

    // Devuelve el path de Storage (deja de ser un return muerto)
    expect(path).toBe('u1/normalizado-por-storage.txt')
  })

  test('optimizer ausente → se crea con cv_generado: true sin romper', async () => {
    h.db.selectData = { job_search_profile: { foo: 1 } } // sin optimizer
    await cvApi.saveGeneratedCV('u1', { blob, filePath: 'p', nombreArchivo: 'n', datos: {} })
    const jsp = h.calls.updatePayload.job_search_profile
    expect(jsp.foo).toBe(1)
    expect(jsp.optimizer).toEqual({ cv_generado: true })
  })

  // Boundary: el fetch del perfil tras el upload devuelve null (pActual null) → el
  // `pActual?.job_search_profile || {}` debe dar base {} y aun así armar payload válido.
  test('perfil ausente tras upload (pActual null) → payload válido sin lanzar', async () => {
    h.db.selectData = null // el fetch de job_search_profile devuelve null
    await cvApi.saveGeneratedCV('u1', { blob, filePath: 'p', nombreArchivo: 'n', datos: { a: 1 } })
    const jsp = h.calls.updatePayload.job_search_profile
    expect(jsp.cv_datos_originales.datos).toEqual({ a: 1 })
    expect(jsp.optimizer).toEqual({ cv_generado: true })
    expect(jsp).not.toHaveProperty('cv_borrador')
  })

  test('lanza y NO escribe el perfil si el upload a Storage falla', async () => {
    h.db.uploadResult = { data: null, error: { message: 'storage down' } }
    await expect(
      cvApi.saveGeneratedCV('u1', { blob, filePath: 'p', nombreArchivo: 'n', datos: {} })
    ).rejects.toThrow('Error al guardar CV en Storage')
    expect(h.calls.updatePayload).toBeNull() // no llegó al update
  })

  test('lanza si el update del perfil falla', async () => {
    h.db.selectData = { job_search_profile: {} }
    h.db.updateError = { message: 'db down' }
    await expect(
      cvApi.saveGeneratedCV('u1', { blob, filePath: 'p', nombreArchivo: 'n', datos: {} })
    ).rejects.toThrow('Error al actualizar el perfil en la base de datos')
  })
})
