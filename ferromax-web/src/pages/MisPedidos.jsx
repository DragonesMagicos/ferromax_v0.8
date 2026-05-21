import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ventaService from '../services/ventaService'

function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  })
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ESTADO_BADGE = {
  COMPLETADA: { label: 'Completada', cls: 'bg-green-100 text-green-700' },
  PENDIENTE:  { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-700' },
  ANULADA:    { label: 'Anulada',    cls: 'bg-red-100 text-red-700' },
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function MisPedidosPage() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [compras, setCompras]   = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (!usuario) { navigate('/tienda/login'); return }
    ventaService.misCompras()
      .then(setCompras)
      .catch(() => setError('No se pudieron cargar tus compras.'))
      .finally(() => setCargando(false))
  }, [usuario, navigate])

  const total = compras
    .filter((c) => c.estado === 'COMPLETADA')
    .reduce((acc, c) => acc + Number(c.total), 0)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/tienda" className="text-xl font-bold text-gray-800">
            🔧 Ferromax
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              {usuario?.nombre}
            </span>
            <Link to="/tienda" className="text-sm text-gray-500 hover:text-violet-600 transition-colors">
              ← Seguir comprando
            </Link>
            <button
              onClick={logout}
              className="text-sm text-gray-400 hover:text-red-600 transition-colors"
            >
              🚪 Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Título */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis compras</h1>
          <p className="text-sm text-gray-500 mt-1">
            Historial de todas tus compras en Ferromax
          </p>
        </div>

        {/* Resumen */}
        {!cargando && compras.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total de compras</p>
              <p className="text-2xl font-bold text-gray-800">{compras.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total gastado</p>
              <p className="text-xl font-bold text-violet-700">{formatPesos(total)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center sm:block hidden">
              <p className="text-xs text-gray-500 mb-1">Última compra</p>
              <p className="text-sm font-semibold text-gray-700">
                {formatFecha(compras[0]?.fecha)}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Lista de compras */}
        {cargando ? <Spinner /> : compras.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center space-y-4">
            <div className="text-6xl">🛒</div>
            <p className="text-gray-500 font-medium">Todavía no realizaste ninguna compra</p>
            <Link
              to="/tienda"
              className="inline-block mt-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {compras.map((compra) => {
              const badge = ESTADO_BADGE[compra.estado] ?? { label: compra.estado, cls: 'bg-gray-100 text-gray-600' }
              return (
                <div key={compra.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Header de la compra */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-400">#{compra.id}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{formatPesos(compra.total)}</span>
                  </div>

                  {/* Detalle */}
                  <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Fecha</p>
                      <p className="text-gray-700 font-medium">{formatFecha(compra.fecha)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Medio de pago</p>
                      <p className="text-gray-700 font-medium capitalize">
                        {compra.medioPago === 'EFECTIVO' ? '💵' : compra.medioPago === 'DEBITO' ? '💳' : '🏦'}
                        {' '}{compra.medioPago.charAt(0) + compra.medioPago.slice(1).toLowerCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Artículos</p>
                      <p className="text-gray-700 font-medium">
                        {compra.cantidadItems} producto{compra.cantidadItems !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {compra.estado === 'ANULADA' && (
                    <div className="px-5 pb-4">
                      <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                        Esta compra fue anulada. Si tenés dudas, contactanos.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}
