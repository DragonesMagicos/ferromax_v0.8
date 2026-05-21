import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(null)
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const tokenGuardado = authService.getToken()
    const usuarioGuardado = authService.getUsuarioGuardado()
    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado)
      setUsuario(usuarioGuardado)
    }
    setCargando(false)
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const data = await authService.login(email, password)
      setToken(data.token)
      setUsuario({ nombre: data.nombre, rol: data.rol })
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback((redirigirA = '/login') => {
    authService.logout()
    setUsuario(null)
    setToken(null)
    navigate(redirigirA)
  }, [navigate])

  const isAdmin = useCallback(() => usuario?.rol === 'ADMIN', [usuario])

  const isEmpleado = useCallback(
    () => usuario?.rol === 'EMPLEADO' || usuario?.rol === 'ADMIN',
    [usuario]
  )

  return (
    <AuthContext.Provider value={{ usuario, token, cargando, login, logout, isAdmin, isEmpleado }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
