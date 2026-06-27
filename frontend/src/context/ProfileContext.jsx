// Estado del PERFIL del usuario y datos derivados: roles, multi-tenancy y progreso
// del Gerente de Búsqueda.
//
// Separado de AuthContext a propósito: la sesión (token) se refresca seguido, pero
// el perfil casi nunca cambia. Al vivir en su propio Provider, un refresh de token
// NO re-renderiza a los consumidores de perfil. Este contexto solo se actualiza
// cuando cambia el usuario (login/logout) o se recarga el perfil explícitamente.
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../services/authService'
import { calcularProgreso } from '../utils/progresoLaboral'
import { useAuth } from './AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Intenta canjear el código de acceso que el usuario dejó en localStorage antes de
// loguearse. No bloqueante: si falla por red lo dejamos para el próximo intento; si
// el código es inválido/agotado lo limpiamos para no reintentar en bucle.
async function redimirCodigoPendiente(token, refreshFn) {
  const code = localStorage.getItem('pending_access_code')
  if (!code) return
  try {
    const res = await fetch(`${API}/api/codes/redeem`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ code }),
    })
    if (res.ok) {
      localStorage.removeItem('pending_access_code')
      refreshFn()  // recargar perfil para reflejar el nuevo acceso
    }
    if (!res.ok && res.status !== 500) {
      localStorage.removeItem('pending_access_code')
    }
  } catch {
    // Silenciar errores de red — no son críticos para el flujo de login
  }
}

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user, loading } = useAuth()
  const [perfil, setPerfil]               = useState(null)
  const [perfilCargado, setPerfilCargado] = useState(false)
  const [jpData, setJpData]               = useState(null)
  const [jpLoaded, setJpLoaded]           = useState(false)

  const fetchPerfil = useCallback(async (userId, email) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (data) {
      let perfActualizado = { ...data }

      // Si no tiene nombre1, intentar recuperarlo de los metadatos del registro
      if (!data.nombre1) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        const meta = authUser?.user_metadata || {}
        if (meta.nombre1 || meta.apellido1) {
          const nombreCompleto = [meta.nombre1, meta.apellido1].filter(Boolean).join(' ')
          const updates = {
            nombre1:     meta.nombre1    || null,
            apellido1:   meta.apellido1  || null,
            indicativo1: meta.indicativo1 || null,
            telefono1:   meta.telefono1  || null,
            nombre:      nombreCompleto  || null,
          }
          await supabase.from('profiles').update(updates).eq('id', userId)
          perfActualizado = { ...perfActualizado, ...updates }
        }
      }

      if (email && !data.email_principal) {
        await supabase.from('profiles').update({ email_principal: email }).eq('id', userId)
        perfActualizado.email_principal = email
      }

      setPerfil(perfActualizado)
    }
    setPerfilCargado(true)
  }, [])

  const fetchJpData = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('job_search_profile')
      .eq('id', userId)
      .maybeSingle()
    setJpData(data?.job_search_profile || null)
    setJpLoaded(true)
  }, [])

  // Carga el perfil cuando cambia el USUARIO (login/logout/reload). Clave: depende de
  // `user?.id`, no de la sesión. En un refresh de token AuthContext mantiene la
  // referencia de `user` estable, así que este efecto NO se redispara — preservando
  // formularios en progreso (ProyectoLaboral, CVWizard, etc.) igual que antes.
  useEffect(() => {
    if (!user) {
      setPerfil(null); setPerfilCargado(true)
      setJpData(null); setJpLoaded(true)
      return
    }
    setPerfilCargado(false)
    fetchPerfil(user.id, user.email)
    fetchJpData(user.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Canje del código de acceso pendiente: SOLO en un login real (evento SIGNED_IN),
  // NO en la rehidratación de sesión de un reload. Replica el gating del modelo
  // original, que lo disparaba dentro de onAuthStateChange con _event === 'SIGNED_IN'
  // y la sesión fresca del evento. Mantenerlo aquí (no en el efecto de carga keyed por
  // user.id) evita reintentar el canje en cada F5 con sesión persistida.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' && session?.access_token && session.user) {
        redimirCodigoPendiente(
          session.access_token,
          () => fetchPerfil(session.user.id, session.user.email),
        )
      }
    })
    return () => subscription.unsubscribe()
  }, [fetchPerfil])

  const refreshJpData = useCallback(async () => {
    if (!user) return
    await fetchJpData(user.id)
  }, [user, fetchJpData])
  const refreshPerfil = useCallback((uid) => fetchPerfil(uid || user?.id), [fetchPerfil, user])
  const refreshUsage  = useCallback(()    => user && fetchPerfil(user.id), [fetchPerfil, user])

  const onboardingPendiente = useMemo(
    () => !loading && perfilCargado && !!user && (!perfil || !perfil.nombre1),
    [loading, perfilCargado, user, perfil],
  )
  const bienvenidaPendiente = useMemo(
    () => !loading && !!user && user.user_metadata?.bienvenida_pendiente === true,
    [loading, user],
  )

  // Progreso del Gerente de Búsqueda (0-100) — disponible globalmente
  const progresoLaboral = useMemo(() => {
    if (!jpLoaded || !perfil) return 0
    return calcularProgreso(jpData, perfil)
  }, [jpData, perfil, jpLoaded])

  // Features se desbloquean al completar el Gerente de Búsqueda al 100% (flujo educativo).
  const featuresDesbloqueadas = progresoLaboral >= 100

  // Roles y multi-tenancy
  const role = perfil?.role || 'user'
  const companyId = perfil?.company_id || null
  const isAdmin = perfil?.role === 'super_admin'
  const isCompanyAdmin = perfil?.role === 'company_admin'

  const value = useMemo(() => ({
    perfil, perfilCargado, jpData, jpLoaded,
    refreshPerfil, refreshUsage, refreshJpData,
    onboardingPendiente, bienvenidaPendiente,
    progresoLaboral, featuresDesbloqueadas,
    role, companyId, isAdmin, isCompanyAdmin,
  }), [
    perfil, perfilCargado, jpData, jpLoaded,
    refreshPerfil, refreshUsage, refreshJpData,
    onboardingPendiente, bienvenidaPendiente,
    progresoLaboral, featuresDesbloqueadas,
    role, companyId, isAdmin, isCompanyAdmin,
  ])

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile debe usarse dentro de ProfileProvider')
  return ctx
}
