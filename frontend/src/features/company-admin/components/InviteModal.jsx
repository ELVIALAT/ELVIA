// features/company-admin/components/InviteModal.jsx
// Modal de invitación individual. Componente props (onClose, onSubmit, primary).
// Extraído verbatim desde pages/CompanyAdmin.jsx (Fase 3).
import { useState } from 'react'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import { useSectorLabels } from '../../../hooks/useSectorLabels'

export default function InviteModal({ onClose, onSubmit, primary }) {
  const [email,        setEmail]       = useState('')
  const [nombre,       setNombre]      = useState('')
  const [apellido,     setApellido]    = useState('')
  const [licenseDays,  setLicenseDays] = useState('90')
  const [loading, setLoading]          = useState(false)
  const L = useSectorLabels()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await onSubmit(email.trim(), nombre.trim(), apellido.trim(), parseInt(licenseDays, 10) || 90)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: `${primary}15`, color: primary }}
          >
            <PaperPlaneTilt size={20} weight="duotone" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{L.inviteMember}</h3>
            <p className="text-sm text-gray-500">Enviaremos un email con instrucciones para activar la cuenta.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Primer nombre</label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: María"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': `${primary}40` }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Primer apellido</label>
              <input
                type="text" value={apellido} onChange={e => setApellido(e.target.value)}
                placeholder="Ej: Gómez"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': `${primary}40` }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email institucional</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder={L.csvSampleEmail}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': `${primary}40` }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Días de licencia</label>
            <div className="flex items-center gap-2">
              <input
                type="number" value={licenseDays} onChange={e => setLicenseDays(e.target.value)}
                min="1" max="730"
                className="w-24 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': `${primary}40` }}
              />
              <span className="text-xs text-gray-400">días calendario desde la activación</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !email}
              className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: primary }}>
              {loading ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
