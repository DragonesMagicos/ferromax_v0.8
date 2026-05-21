import { useEffect, useState, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import ventaService from '../services/ventaService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const ESTADO_BADGE = {
  COMPLETADA: 'bg-green-100 text-green-700',
  PENDIENTE:  'bg-yellow-100 text-yellow-700',
  ANULADA:    'bg-red-100 text-red-700',
}

const MEDIO_ICONO = {
  EFECTIVO: '💵',
  DEBITO:   '💳',
  CREDITO:  '🏦',
}

const ORIGEN_BADGE = {
  POS: { label: 'POS',  cls: 'bg-blue-50 text-blue-700'   },
  WEB: { label: 'Web',  cls: 'bg-violet-50 text-violet-700' },
}

function origenBadge(origen, cajero) {
  if (origen === 'WEB') return ORIGEN_BADGE.WEB
  // Distingue admin de empleado por nombre del cajero si se necesita
  return ORIGEN_BADGE.POS
}

function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

function hace30Dias() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ModalAnular({ venta, onConfirmar, onCerrar }) {
  const [loading, setLoading] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">⚠️</span>
          <h2 className="text-base font-semibold text-gray-800">Anular venta #{venta.id}</h2>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Total: <strong>{formatPesos(venta.total)}</strong> — {formatFecha(venta.fecha)}
        </p>
        <p className="text-sm text-gray-500 mb-5">
          Esta acción revierte el stock de los productos. No se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCerrar} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button
            disabled={loading}
            onClick={async () => { setLoading(true); await onConfirmar(); setLoading(false) }}
            className="px-5 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Anulando…' : 'Anular venta'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VentasPage() {
  const { isAdmin } = useAuth()
  const esAdmin = isAdmin()

  const [ventas, setVentas]             = useState([])
  const [cargando, setCargando]         = useState(true)
  const [desde, setDesde]               = useState(hace30Dias())
  const [hasta, setHasta]               = useState(hoy())
  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [filtroMedio, setFiltroMedio]   = useState('TODOS')
  const [modalAnular, setModalAnular]   = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const data = esAdmin
        ? await ventaService.listar(desde, hasta)
        : await ventaService.misVentasHoy()
      setVentas(data)
    } catch {
      toast.error('No se pudieron cargar las ventas')
    } finally {
      setCargando(false)
    }
  }, [esAdmin, desde, hasta])

  useEffect(() => { cargar() }, [cargar])

  const ventasFiltradas = ventas.filter((v) => {
    if (filtroEstado !== 'TODOS' && v.estado !== filtroEstado) return false
    if (filtroMedio  !== 'TODOS' && v.medioPago !== filtroMedio) return false
    return true
  })

  const totalFiltrado = ventasFiltradas
    .filter((v) => v.estado === 'COMPLETADA')
    .reduce((acc, v) => acc + Number(v.total), 0)

  const handleAnular = async () => {
    try {
      const actualizada = await ventaService.anular(modalAnular.id)
      setVentas((prev) => prev.map((v) => v.id === actualizada.id ? actualizada : v))
      toast.success(`Venta #${modalAnular.id} anulada`)
      setModalAnular(null)
    } catch (err) {
      const msg = err.response?.data?.mensaje ?? 'No se pudo anular la venta'
      toast.error(msg)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-800">
            {esAdmin ? 'Ventas' : 'Mis ventas de hoy'}
          </h1>
          <button
            onClick={cargar}
            disabled={cargando}
            className="text-sm text-gray-500 hover:text-violet-600 transition-colors disabled:opacity-40"
          >
            🔄 Actualizar
          </button>
        </header>

        <div className="p-8 space-y-6">

          {/* Filtros — solo ADMIN */}
          {esAdmin && <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="TODOS">Todos</option>
                  <option value="COMPLETADA">Completada</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ANULADA">Anulada</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Medio de pago</label>
                <select value={filtroMedio} onChange={(e) => setFiltroMedio(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                  <option value="TODOS">Todos</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="DEBITO">Débito</option>
                  <option value="CREDITO">Crédito</option>
                </select>
              </div>
            </div>
          </div>}

          {/* Resumen rápido */}
          {!cargando && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Ventas completadas</p>
                <p className="text-2xl font-bold text-gray-800">
                  {ventasFiltradas.filter(v => v.estado === 'COMPLETADA').length}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Total recaudado</p>
                <p className="text-2xl font-bold text-green-700">{formatPesos(totalFiltrado)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Anuladas</p>
                <p className="text-2xl font-bold text-red-600">
                  {ventasFiltradas.filter(v => v.estado === 'ANULADA').length}
                </p>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {cargando ? <Spinner /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Fecha y hora</th>
                      <th className="px-4 py-3 font-medium">Cajero</th>
                      <th className="px-4 py-3 font-medium">Origen</th>
                      <th className="px-4 py-3 font-medium">Medio de pago</th>
                      <th className="px-4 py-3 font-medium text-center">Items</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                      <th className="px-4 py-3 font-medium text-center">Estado</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ventasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                          No hay ventas en el período seleccionado
                        </td>
                      </tr>
                    ) : ventasFiltradas.map((v) => (
                      <tr key={v.id} className={`hover:bg-gray-50 transition-colors ${v.estado === 'ANULADA' ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{v.id}</td>
                        <td className="px-4 py-3 text-gray-600">{formatFecha(v.fecha)}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{v.nombreCajero}</td>
                        <td className="px-4 py-3">
                          {(() => { const b = origenBadge(v.origen); return (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b.cls}`}>
                              {b.label}
                            </span>
                          )})()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <span>{MEDIO_ICONO[v.medioPago] ?? '💰'}</span>
                            {v.medioPago.charAt(0) + v.medioPago.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{v.cantidadItems}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatPesos(v.total)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_BADGE[v.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                            {v.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {esAdmin && v.estado === 'COMPLETADA' && (
                            <button
                              onClick={() => setModalAnular(v)}
                              className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            >
                              Anular
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Footer con total */}
                {ventasFiltradas.length > 0 && (
                  <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50">
                    <span className="text-xs text-gray-500">
                      {ventasFiltradas.length} registro{ventasFiltradas.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      Total: <span className="text-green-700">{formatPesos(totalFiltrado)}</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {modalAnular && (
        <ModalAnular
          venta={modalAnular}
          onConfirmar={handleAnular}
          onCerrar={() => setModalAnular(null)}
        />
      )}
    </div>
  )
}
