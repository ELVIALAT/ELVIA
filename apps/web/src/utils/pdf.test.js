// Prueba que el helper generarPdf reproduce EXACTAMENTE el config que antes vivía inline
// en cada uno de los 5 call sites (byte-equivalencia de la consolidación). Mockea
// html2pdf.js capturando el payload de .set() y el modo de salida (save vs blob).
import { describe, test, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ setPayload: null, fromTarget: null, saved: false, blobAsked: false }))

vi.mock('html2pdf.js', () => {
  const worker = {
    set(payload) { h.setPayload = payload; return worker },
    from(target) { h.fromTarget = target; return worker },
    save() { h.saved = true; return Promise.resolve() },
    outputPdf(kind) { h.blobAsked = kind === 'blob'; return Promise.resolve(new Blob(['x'])) },
  }
  return { default: () => worker }
})

import { generarPdf } from './pdf'

beforeEach(() => { h.setPayload = null; h.fromTarget = null; h.saved = false; h.blobAsked = false })

const EL = { tag: 'fake-node' }

describe('generarPdf — presets equivalentes a los call sites originales', () => {
  test('ReporteLaboral (a4/mm, pagebreak, html2canvas extra, save)', async () => {
    await generarPdf(EL, {
      filename: 'Autoconocimiento_Ana.pdf', margin: 0, quality: 0.97,
      format: 'a4', unit: 'mm',
      html2canvas: { scrollY: 0, windowWidth: 794 },
      pagebreak: { mode: ['css', 'legacy'] },
    })
    expect(h.setPayload).toEqual({
      margin: 0,
      filename: 'Autoconocimiento_Ana.pdf',
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] },
    })
    expect(h.fromTarget).toBe(EL)
    expect(h.saved).toBe(true)
  })

  test('ProyectoLaboral (px [794,1123], output blob, sin pagebreak)', async () => {
    const blob = await generarPdf(EL, {
      filename: 'infografia.pdf', margin: 0, quality: 0.98,
      format: [794, 1123], unit: 'px', output: 'blob',
    })
    expect(h.setPayload).toEqual({
      margin: 0,
      filename: 'infografia.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' },
    })
    expect(h.setPayload).not.toHaveProperty('pagebreak') // no se inyecta si no se pasa
    expect(h.blobAsked).toBe(true)
    expect(blob).toBeInstanceOf(Blob)
  })

  test('MisCVs LinkedIn / useLinkedinPro (margin 8, a4/mm, save)', async () => {
    await generarPdf(EL, {
      filename: 'Analisis LinkedIn.pdf', margin: 8, quality: 0.95,
      format: 'a4', unit: 'mm',
    })
    expect(h.setPayload).toEqual({
      margin: 8,
      filename: 'Analisis LinkedIn.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    expect(h.saved).toBe(true)
  })

  test('MisCVs Compensación (px [794,1123], save)', async () => {
    await generarPdf(EL, {
      filename: 'Reporte de Compensacion.pdf', margin: 0, quality: 0.98,
      format: [794, 1123], unit: 'px',
    })
    expect(h.setPayload.jsPDF).toEqual({ unit: 'px', format: [794, 1123], orientation: 'portrait' })
    expect(h.setPayload.image).toEqual({ type: 'jpeg', quality: 0.98 })
    expect(h.saved).toBe(true)
  })

  test('defaults: margin 0, quality 0.98, a4/mm, output save', async () => {
    await generarPdf(EL, { filename: 'x.pdf' })
    expect(h.setPayload).toEqual({
      margin: 0,
      filename: 'x.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    expect(h.saved).toBe(true)
  })
})
