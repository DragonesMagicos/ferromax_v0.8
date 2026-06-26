import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiereAdmin = false, requiereEmpleado = false }) {
  const { usuario, cargando, isAdmin, isEmpleado } = useAuth()

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/admin/login" replace />
  }

  if (requiereAdmin && !isAdmin()) {
    if (isEmpleado()) return <Navigate to="/pos" replace />
    return <Navigate to="/admin/login" replace />
  }

  if (requiereEmpleado && !isEmpleado()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-gray-600">
        <span className="text-5xl">🚫</span>
        <h1 className="text-2xl font-semibold">Acceso denegado</h1>
        <p>No tenés permiso para ver esta página.</p>
        <a href="/" className="text-blue-600 underline">Volver al inicio</a>
      </div>
    )
  }

  return children
}
