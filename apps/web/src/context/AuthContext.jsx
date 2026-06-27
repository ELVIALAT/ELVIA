// Estado global de SESIÓN (capa de auth).
//
// Solo maneja la sesión de Supabase: user, session (token), loading y el flag de
// recuperación de contraseña. El PERFIL del usuario y los datos derivados (roles,
// progreso, multi-tenancy) viven en ProfileContext; la política de acceso/plan en
// usePlan. Esta separación hace que un refresh de token —que solo cambia `session`—
// no re-renderice a los consumidores de perfil.
import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { supabase } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]                 = useState(null)
  const [session, setSession]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [isRecovering, setIsRecovering] = useState(false)
  // Ref para saber el user.id activo SIN depender del closure del efecto.
  // Permite que onAuthStateChange distinga "mismo usuario, token refrescado"
  // de "login real" sin tener que re-crear la suscripción.
  const activeUserIdRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      activeUserIdRef.current = session?.user?.id ?? null
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true)
      }

      // Si el user.id no cambió (token refresh, INITIAL_SESSION, tab focus, etc.),
      // solo actualizamos la sesión (token fresco) sin tocar `user`. Mantener la
      // referencia de `user` estable evita que ProfileContext recargue el perfil y
      // desmonte páginas con formularios en progreso (ProyectoLaboral, CVWizard…)
      // cada vez que Supabase renueva el access token.
      const incomingId = session?.user?.id ?? null
      const isSameUser = incomingId !== null && incomingId === activeUserIdRef.current
      if (isSameUser) {
        setSession(session)
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      activeUserIdRef.current = incomingId
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = useCallback((email, password, captchaToken) =>
    supabase.auth.signInWithPassword({ email, password, options: { ...(captchaToken ? { captchaToken } : {}) } }), [])
  const register = useCallback((email, password, extraData = {}, captchaToken) =>
    supabase.auth.signUp({ email, password, options: { data: extraData, ...(captchaToken ? { captchaToken } : {}) } }), [])
  const logout   = useCallback(async () => {
    // Limpiar caché de tenant para evitar contaminación entre sesiones
    try {
      const keysToRemove = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith('tenant_v1_')) keysToRemove.push(key)
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k))
    } catch { /* silenciar errores de quota */ }
    return supabase.auth.signOut()
  }, [])

  const value = useMemo(() => ({
    user, session, loading,
    login, register, logout,
    isRecovering, setIsRecovering,
  }), [user, session, loading, login, register, logout, isRecovering])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
