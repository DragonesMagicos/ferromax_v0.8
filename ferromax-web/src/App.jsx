import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/PrivateRoute'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import Productos from './pages/Productos'
import Ventas from './pages/Ventas'
import POS from './pages/POS'
import RecepcionPage from './pages/RecepcionPage'
import RemitosPage from './pages/RemitosPage'
import AjusteStockPage from './pages/AjusteStockPage'
import Tienda from './pages/Tienda'
import TiendaLogin from './pages/TiendaLogin'
import TiendaConfirmacion from './pages/TiendaConfirmacion'
import MisPedidos from './pages/MisPedidos'
import Catalogo from './pages/Catalogo'
import CatalogoCategoria from './pages/CatalogoCategoria'

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tienda" element={<Tienda />} />
          <Route path="/tienda/login" element={<TiendaLogin />} />
          <Route path="/tienda/confirmacion" element={<TiendaConfirmacion />} />
          <Route path="/tienda/mis-pedidos" element={<MisPedidos />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/catalogo/:categoria" element={<CatalogoCategoria />} />

          {/* Rutas solo ADMIN */}
          <Route path="/remitos" element={
            <ProtectedRoute requiereAdmin>
              <RemitosPage />
            </ProtectedRoute>
          } />
          <Route path="/ajuste-stock" element={
            <ProtectedRoute requiereAdmin>
              <AjusteStockPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute requiereAdmin>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/productos" element={
            <ProtectedRoute requiereEmpleado>
              <Productos />
            </ProtectedRoute>
          } />
          <Route path="/ventas" element={
            <ProtectedRoute requiereEmpleado>
              <Ventas />
            </ProtectedRoute>
          } />

          {/* Rutas ADMIN y EMPLEADO */}
          <Route path="/pos" element={
            <ProtectedRoute requiereEmpleado>
              <POS />
            </ProtectedRoute>
          } />
          <Route path="/recepcion" element={
            <ProtectedRoute requiereEmpleado>
              <RecepcionPage />
            </ProtectedRoute>
          } />

          {/* Fallback: ADMIN → dashboard, EMPLEADO → POS */}
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </AuthProvider>
    </>
  )
}
