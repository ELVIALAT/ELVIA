// features/company-admin/useCompanyAdmin.js
// Estado, guard de rol, fetch de datos (/api/company/*) y handlers (invitación, CSV
// bulk, revoke) del panel HR, extraídos VERBATIM desde pages/CompanyAdmin.jsx.
// Sin persistencia de browser; los datos viven en el backend vía fetch.
// El orquestador llama useCompanyAdmin() y provee el resultado por CompanyAdminContext.
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../context/ProfileContext'
import { useTenant, DEFAULT_TENANT } from '../../context/TenantContext'
import { useSectorLabels } from '../../hooks/useSectorLabels'
import { toast } from 'react-hot-toast'
import { API } from './constants'

export function useCompanyAdmin() {
  const navigate = useNavigate()
  const { user, session, loading: authLoading, logout } = useAuth()
  const { perfil } = useProfile()
  const { tenant, cohort } = useTenant()
  const L = useSectorLabels()

  const [tab, setTab]               = useState('resumen')
  const [company, setCompany]       = useState(null)
  const [users, setUsers]           = useState([])
  const [invitations, setInvitations] = useState([])
  const [allowlist, setAllowlist]   = useState([])
  const [dashboard, setDashboard]   = useState({ stats: {} })
  const [loading, setLoading]       = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showCsvModal, setShowCsvModal] = useState(false)

  const primary   = tenant.primary_color   || DEFAULT_TENANT.primary_color
  const secondary = tenant.secondary_color || DEFAULT_TENANT.secondary_color

  // ── Guard: solo company_admin ──
  useEffect(() => {
    if (!authLoading && user) {
      if (perfil && perfil.role !== 'company_admin' && perfil.role !== 'super_admin') {
        navigate('/dashboard', { replace: true })
      }
    } else if (!authLoading && !user) {
      navigate('/auth', { replace: true })
    }
  }, [user, perfil, authLoading, navigate])

  // ── Fetch data ──
  const fetchAll = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    const headers = { Authorization: `Bearer ${session.access_token}` }
    try {
      const [profileRes, usersRes, invRes, dashRes, alRes] = await Promise.all([
        fetch(`${API}/api/company/profile`,    { headers }),
        fetch(`${API}/api/company/users`,      { headers }),
        fetch(`${API}/api/company/invitations`,{ headers }),
        fetch(`${API}/api/company/dashboard`,  { headers }),
        fetch(`${API}/api/company/allowlist`,  { headers }),
      ])
      const [pJson, uJson, iJson, dJson, alJson] = await Promise.all([
        profileRes.json().catch(() => ({})),
        usersRes.json().catch(() => ({})),
        invRes.json().catch(() => ({})),
        dashRes.json().catch(() => ({})),
        alRes.json().catch(() => ({})),
      ])
      if (pJson.company)     setCompany(pJson.company)
      if (uJson.users)       setUsers(uJson.users)
      if (iJson.invitations) setInvitations(iJson.invitations)
      if (dJson.stats)       setDashboard(dJson)
      if (alJson.allowlist)  setAllowlist(alJson.allowlist)
    } catch (err) {
      console.error('[CompanyAdmin] fetch error:', err)
      toast.error('No fue posible cargar los datos del programa.')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── CSV bulk upload handler ──
  const handleCsvBulk = async (rows, cohortDefault) => {
    if (!session?.access_token) return
    try {
      const res = await fetch(`${API}/api/company/allowlist/bulk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rows, cohort_default: cohortDefault || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(data.summary || `${data.upserted} filas cargadas.`)
        setShowCsvModal(false)
        fetchAll()
      } else {
        toast.error(data.error || 'No fue posible cargar el archivo.')
      }
    } catch (err) {
      toast.error('Error de conexion.')
    }
  }

  // ── Revoke entry handler ──
  const handleRevoke = async (id, currentStatus) => {
    if (!session?.access_token) return
    const action = currentStatus === 'revoked' ? 'unrevoke' : 'revoke'
    try {
      const res = await fetch(`${API}/api/company/allowlist/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        toast.success(action === 'revoke' ? 'Acceso revocado' : 'Acceso restablecido')
        fetchAll()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'No fue posible actualizar.')
      }
    } catch (err) {
      toast.error('Error de conexion.')
    }
  }

  // ── Invitation handler ──
  const handleInvite = async (email, nombre, apellido, license_days) => {
    if (!session?.access_token) return
    try {
      const res = await fetch(`${API}/api/company/invitations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, nombre, apellido, license_days }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        toast.success(`Invitación enviada a ${email}`)
        setShowInviteModal(false)
        fetchAll()
      } else {
        toast.error(data.error || 'No fue posible enviar la invitación.')
      }
    } catch (err) {
      toast.error('Error de conexión.')
    }
  }

  const stats = dashboard.stats || {}

  // ── API expuesto por context ─────────────────────────────────────────────────
  return {
    // gating / loading
    authLoading, loading,
    // navegación de tabs
    tab, setTab,
    // datos
    company, users, invitations, allowlist, stats,
    // modales
    showInviteModal, setShowInviteModal, showCsvModal, setShowCsvModal,
    // handlers
    handleInvite, handleCsvBulk, handleRevoke,
    // tema / contexto
    primary, secondary, cohort, tenant, L,
    // sesión
    perfil, user, logout, navigate,
  }
}
