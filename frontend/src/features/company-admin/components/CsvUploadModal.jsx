// features/company-admin/components/CsvUploadModal.jsx
// Modal de carga masiva de CSV (parsea en frontend, preview, envía rows[] al backend).
// Componente props (onClose, onSubmit, primary, defaultCohort).
// Extraído verbatim desde pages/CompanyAdmin.jsx (Fase 3).
import { useState } from 'react'
import * as PI from '@phosphor-icons/react'
import { useSectorLabels } from '../../../hooks/useSectorLabels'

export default function CsvUploadModal({ onClose, onSubmit, primary, defaultCohort }) {
  const [file, setFile]   = useState(null)
  const [rows, setRows]   = useState([])
  const [errors, setErrors] = useState([])
  const [cohort, setCohort] = useState(defaultCohort || '')
  const [loading, setLoading] = useState(false)
  const L = useSectorLabels()

  const handleFile = async (f) => {
    setFile(f)
    setErrors([])
    setRows([])
    try {
      const text = await f.text()
      // Detect separator
      const firstLine = text.split(/\r?\n/)[0] || ''
      const sep = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ','

      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
      if (lines.length === 0) { setErrors([{ row: 0, error: 'Archivo vacio' }]); return }

      // Parse header
      const headers = lines[0].split(sep).map(h => h.trim().toLowerCase().replace(/[^a-z_]/g, ''))
      const idx = {
        email:        headers.indexOf('email'),
        nombre:       headers.indexOf('nombre'),
        apellido:     headers.indexOf('apellido'),
        cohort:       headers.indexOf('cohort'),
        area:         headers.indexOf('area'),
        cargo_actual: headers.findIndex(h => h === 'cargoactual' || h === 'cargo'),
        license_days: headers.findIndex(h => h === 'licensedays' || h === 'diaslicencia' || h === 'dias' || h === 'licencia' || h === 'license_days' || h === 'dias_licencia'),
      }

      if (idx.email === -1) {
        setErrors([{ row: 0, error: 'Falta columna "email" en el header' }])
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const parsed = []
      const errs = []
      const seen = new Set()

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(sep).map(c => c.trim().replace(/^"|"$/g, ''))
        const email = (cols[idx.email] || '').toLowerCase()
        if (!email) { errs.push({ row: i + 1, error: 'email vacio' }); continue }
        if (!emailRegex.test(email)) { errs.push({ row: i + 1, error: 'email invalido: ' + email }); continue }
        if (seen.has(email)) { errs.push({ row: i + 1, error: 'duplicado en archivo: ' + email }); continue }
        seen.add(email)

        const rawDays = idx.license_days !== -1 ? parseInt(cols[idx.license_days], 10) : NaN
        parsed.push({
          email,
          nombre:       idx.nombre   !== -1 ? cols[idx.nombre]   : '',
          apellido:     idx.apellido !== -1 ? cols[idx.apellido] : '',
          cohort:       idx.cohort   !== -1 ? cols[idx.cohort]   : '',
          area:         idx.area     !== -1 ? cols[idx.area]     : '',
          cargo_actual: idx.cargo_actual !== -1 ? cols[idx.cargo_actual] : '',
          license_days: !isNaN(rawDays) && rawDays > 0 ? rawDays : 90,
        })
      }

      setRows(parsed)
      setErrors(errs)
    } catch (err) {
      setErrors([{ row: 0, error: 'Error leyendo archivo: ' + err.message }])
    }
  }

  const downloadTemplate = () => {
    const csv = `email,nombre,apellido,cohort,area,cargo_actual,dias_licencia\n${L.csvSampleEmail},Juan,Perez,cohort-2026,Programa,${L.member},90\n`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'plantilla_allowlist.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleSubmit = async () => {
    if (rows.length === 0) return
    setLoading(true)
    await onSubmit(rows, cohort)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${primary}15`, color: primary }}>
            <PI.UploadSimple size={20} weight="duotone" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{L.uploadListTitle}</h3>
            <p className="text-sm text-gray-500">Sube un CSV con los emails que tendrán acceso al programa.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><PI.X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Step 1: Plantilla */}
          {!file && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-start gap-3">
              <PI.Info size={18} className="text-gray-400 mt-0.5 shrink-0" weight="duotone" />
              <div className="flex-1 text-sm text-gray-600 leading-relaxed">
                Columnas requeridas: <code className="px-1 bg-white rounded">email</code>. Opcionales: <code className="px-1 bg-white rounded">nombre, apellido, cohort, area, cargo_actual, dias_licencia</code> (días de acceso; default 90).
                <button onClick={downloadTemplate} className="font-semibold ml-2 hover:underline" style={{ color: primary }}>
                  Descargar plantilla
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Archivo CSV</label>
            <label className="block border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-300 transition-colors">
              <input type="file" accept=".csv,.txt" className="hidden" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
              {file ? (
                <div className="text-sm text-gray-700">
                  <PI.FileCsv size={32} weight="duotone" className="mx-auto mb-2" style={{ color: primary }} />
                  <strong>{file.name}</strong> · {(file.size / 1024).toFixed(1)} KB
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  <PI.UploadSimple size={32} weight="duotone" className="mx-auto mb-2 text-gray-400" />
                  Click para seleccionar un CSV
                </div>
              )}
            </label>
          </div>

          {/* Cohort override */}
          {file && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cohorte (opcional — aplica a filas sin cohort en el CSV)</label>
              <input type="text" value={cohort} onChange={e => setCohort(e.target.value)}
                placeholder="ej: telefonica-2026-05"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': `${primary}40` }}
              />
            </div>
          )}

          {/* Errores */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                <PI.WarningCircle size={16} weight="fill" />
                {errors.length} errores detectados
              </div>
              <div className="text-xs text-red-600 max-h-32 overflow-y-auto space-y-1">
                {errors.slice(0, 20).map((e, i) => <div key={i}>Fila {e.row}: {e.error}</div>)}
                {errors.length > 20 && <div className="text-red-400">... y {errors.length - 20} mas</div>}
              </div>
            </div>
          )}

          {/* Preview */}
          {rows.length > 0 && (
            <div>
              <div className="text-xs font-bold text-gray-700 mb-2">Vista previa ({rows.length} filas validas)</div>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest">Email</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest">Nombre</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest">Cohort</th>
                        <th className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-widest">Area</th>
                        <th className="px-3 py-2 text-right font-bold text-gray-500 uppercase tracking-widest">Días</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono">{r.email}</td>
                          <td className="px-3 py-2">{r.nombre} {r.apellido}</td>
                          <td className="px-3 py-2 text-gray-500">{r.cohort || cohort || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{r.area || '—'}</td>
                          <td className="px-3 py-2 text-right text-gray-700 font-medium">{r.license_days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {rows.length > 50 && <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50">... y {rows.length - 50} mas</div>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading || rows.length === 0}
            className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            style={{ background: primary }}>
            {loading ? 'Cargando...' : `Cargar ${rows.length} entradas`}
          </button>
        </div>
      </div>
    </div>
  )
}
