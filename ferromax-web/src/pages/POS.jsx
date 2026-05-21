import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import Sidebar from '../components/Sidebar'
import POSCarrito from '../components/pos/POSCarrito'
import productoService from '../services/productoService'
import ventaService from '../services/ventaService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  Search, Scan, Loader2, Banknote, CreditCard,
  Building2, Trash2, ShoppingCart, Zap, X, CheckCircle2,
  Printer, Package,
} from 'lucide-react'

const MEDIOS_PAGO = [
  { valor: 'EFECTIVO',    label: 'Efectivo', Icono: Banknote,   color: 'emerald' },
  { valor: 'DEBITO',      label: 'Débito',   Icono: CreditCard,  color: 'blue'    },
  { valor: 'CREDITO',     label: 'Crédito',  Icono: Building2,   color: 'violet'  },
  { valor: 'MERCADOPAGO', label: 'MP',        Icono: CreditCard,  color: 'sky'     },
]

const COLOR_MAP = {
  emerald: { active: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  blue:    { active: 'border-blue-500 bg-blue-50 text-blue-700'          },
  violet:  { active: 'border-violet-500 bg-violet-50 text-violet-700'    },
  sky:     { active: 'border-sky-500 bg-sky-50 text-sky-700'             },
}

const SCANNER_MS_PER_CHAR = 30

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

// ── Modal Ticket ──────────────────────────────────────────────────────────────

function ModalTicket({ ticket, onCerrar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#1A1A2E] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF6B35]/20 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={18} className="text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Venta registrada</p>
              <p className="text-white/40 text-xs font-mono">#{ticket.id} · {formatFecha(ticket.fecha)}</p>
            </div>
          </div>
          <button onClick={onCerrar} className="text-white/30 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5 space-y-4">

          {/* Items */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Detalle</p>
            <div className="divide-y divide-gray-100">
              {ticket.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.nombreProducto}</p>
                    <p className="text-xs text-gray-400 font-mono">{item.sku} · {formatPesos(item.precioUnitario)} c/u</p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-sm font-semibold text-gray-800">{formatPesos(item.subtotal)}</p>
                    <p className="text-xs text-gray-400">x{item.cantidad}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-[#F8F9FA] rounded-xl p-4 space-y-2">
            {ticket.descuento > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatPesos(ticket.subtotal)}</span>
              </div>
            )}
            {ticket.descuento > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Descuento</span>
                <span>− {formatPesos(ticket.descuento)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span
                className="text-2xl font-black text-[#1A1A2E]"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                {formatPesos(ticket.total)}
              </span>
            </div>
          </div>

          {/* Medio de pago */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Medio de pago</span>
            <span className="font-semibold text-gray-700">
              {ticket.medioPago.charAt(0) + ticket.medioPago.slice(1).toLowerCase()}
            </span>
          </div>
          {ticket.comprobanteId && (
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Comprobante</span>
              <span className="font-mono text-xs text-gray-400">#{ticket.comprobanteId}</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer size={14} /> Imprimir
          </button>
          <button
            onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl bg-[#FF6B35] text-white text-sm font-bold hover:bg-[#e55a2b] transition-colors"
          >
            Nueva venta
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function POSPage() {
  const { isAdmin } = useAuth()
  const esAdmin = isAdmin()

  const [carrito, setCarrito]             = useState([])
  const [busqueda, setBusqueda]           = useState('')
  const [buscando, setBuscando]           = useState(false)
  const [resultados, setResultados]       = useState([])
  const [medioPago, setMedioPago]         = useState(null)
  const [montoRecibido, setMontoRecibido] = useState('')
  const [cobrando, setCobrando]           = useState(false)
  const [modoEscaner, setModoEscaner]     = useState(false)
  const [ticket, setTicket]               = useState(null)
  const [stockEnVivo, setStockEnVivo]     = useState({})

  const inputRef      = useRef(null)
  const busquedaTimer = useRef(null)
  const scanStartTime = useRef(null)
  const scanCharCount = useRef(0)
  const stompRef      = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // ── WebSocket: suscribirse al stock de cada producto en el carrito ─────────
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/api/ws'),
      reconnectDelay: 5000,
    })

    client.onConnect = () => {
      stompRef.current = client
    }

    client.activate()
    return () => client.deactivate()
  }, [])

  useEffect(() => {
    const client = stompRef.current
    if (!client?.connected || carrito.length === 0) return

    const subs = carrito.map((item) =>
      client.subscribe(`/topic/stock/${item.producto.id}`, (msg) => {
        const ev = JSON.parse(msg.body)
        setStockEnVivo((prev) => ({ ...prev, [ev.productoId]: ev.stockActual }))
      })
    )

    return () => subs.forEach((s) => s.unsubscribe())
  }, [carrito])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const enfocarBuscador = useCallback(() => {
    setBusqueda('')
    setResultados([])
    scanStartTime.current = null
    scanCharCount.current = 0
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const agregarAlCarrito = useCallback((producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id)
      if (existe) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * Number(i.producto.precio) }
            : i
        )
      }
      return [...prev, { producto, cantidad: 1, subtotal: Number(producto.precio) }]
    })
    setResultados([])
    toast.success(producto.nombre, {
      duration: 1200,
      position: 'bottom-right',
      style: { borderRadius: '12px', background: '#1A1A2E', color: '#fff', fontSize: '13px' },
      iconTheme: { primary: '#FF6B35', secondary: '#fff' },
    })
  }, [])

  const buscarProducto = useCallback(async (texto, esEscaner = false) => {
    const q = texto.trim()
    if (q.length < 2) return
    setBuscando(true)
    setModoEscaner(esEscaner)

    const buscarBarcode = esAdmin
      ? () => productoService.buscarPorCodigoBarras(q)
      : () => productoService.buscarPorCodigoBarrasEmpleado(q)

    const buscarSku = esAdmin
      ? () => productoService.buscarPorSku(q)
      : () => productoService.buscarPorSkuEmpleado(q)

    const listar = esAdmin
      ? () => productoService.listar()
      : () => productoService.listarEmpleado()

    try {
      const porBarcode = await buscarBarcode().catch(() => null)
      if (porBarcode) { agregarAlCarrito(porBarcode); enfocarBuscador(); return }

      const porSku = await buscarSku().catch(() => null)
      if (porSku) { agregarAlCarrito(porSku); enfocarBuscador(); return }

      if (esEscaner) {
        toast.error(`Código no registrado: ${q}`, { style: { borderRadius: '12px' } })
        enfocarBuscador()
        return
      }

      const todos = await listar()
      const coincidencias = todos.filter(
        (p) => p.activo !== false && p.nombre.toLowerCase().includes(q.toLowerCase())
      )

      if (coincidencias.length === 1) {
        agregarAlCarrito(coincidencias[0])
        enfocarBuscador()
      } else if (coincidencias.length === 0) {
        toast.error('Producto no encontrado')
      } else {
        setResultados(coincidencias)
      }
    } catch {
      toast.error('Error al buscar el producto')
    } finally {
      setBuscando(false)
      setTimeout(() => setModoEscaner(false), 1000)
    }
  }, [esAdmin, agregarAlCarrito, enfocarBuscador])

  const handleChangeBusqueda = (e) => {
    const val = e.target.value
    setBusqueda(val)
    setResultados([])
    clearTimeout(busquedaTimer.current)

    if (scanStartTime.current === null && val.length > 0) {
      scanStartTime.current = Date.now()
      scanCharCount.current = 1
    } else {
      scanCharCount.current = val.length
    }

    if (val.trim().length >= 3) {
      busquedaTimer.current = setTimeout(() => buscarProducto(val, false), 450)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return
    clearTimeout(busquedaTimer.current)
    const q = busqueda.trim()
    if (!q) return
    const elapsed = scanStartTime.current ? Date.now() - scanStartTime.current : 9999
    const msPerChar = q.length > 0 ? elapsed / q.length : 9999
    const esEscaner = msPerChar < SCANNER_MS_PER_CHAR && q.length >= 4
    buscarProducto(q, esEscaner)
  }

  const cambiarCantidad = useCallback((productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito((prev) => prev.filter((i) => i.producto.id !== productoId))
      return
    }
    setCarrito((prev) =>
      prev.map((i) =>
        i.producto.id === productoId
          ? { ...i, cantidad: nuevaCantidad, subtotal: nuevaCantidad * Number(i.producto.precio) }
          : i
      )
    )
  }, [])

  const eliminarItem = useCallback((productoId) => {
    setCarrito((prev) => prev.filter((i) => i.producto.id !== productoId))
  }, [])

  const total      = carrito.reduce((acc, i) => acc + i.subtotal, 0)
  const totalItems = carrito.reduce((acc, i) => acc + i.cantidad, 0)
  const vuelto     = medioPago === 'EFECTIVO' && montoRecibido !== ''
    ? Number(montoRecibido) - total
    : null

  const handleCobrar = async () => {
    if (carrito.length === 0) { toast.error('El carrito está vacío'); return }
    if (!medioPago)            { toast.error('Seleccioná un medio de pago'); return }

    setCobrando(true)
    try {
      const ticketData = await ventaService.registrar({
        medioPago,
        clienteId: null,
        items: carrito.map((i) => ({
          productoId: Number(i.producto.id),
          cantidad: Number(i.cantidad),
        })),
      })
      setTicket(ticketData)
      setCarrito([])
      setMedioPago(null)
      setMontoRecibido('')
      setStockEnVivo({})
    } catch (err) {
      const msg = err.response?.data?.mensaje ?? err.response?.data?.error ?? err.message ?? 'Error al registrar la venta'
      toast.error(msg, { duration: 6000 })
    } finally {
      setCobrando(false)
    }
  }

  const cerrarTicket = () => {
    setTicket(null)
    enfocarBuscador()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 h-[72px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center">
              <ShoppingCart size={18} className="text-[#FF6B35]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#1A1A2E]">Punto de Venta</h1>
              <p className="text-xs text-gray-400">Buscá por nombre, SKU o escaneá el código</p>
            </div>
          </div>

          <AnimatePresence>
            {modoEscaner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold px-4 py-2 rounded-full"
              >
                <Scan size={14} className="animate-pulse" />
                Escáner detectado
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <div className="flex-1 flex overflow-hidden p-6 gap-5">

          {/* ── Columna izquierda ── */}
          <div className="flex-[3] flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Buscador */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {buscando
                    ? <Loader2 size={16} className="animate-spin text-[#FF6B35]" />
                    : <Search size={16} />
                  }
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={busqueda}
                  onChange={handleChangeBusqueda}
                  onKeyDown={handleKeyDown}
                  placeholder="SKU, nombre del producto o escaneá el código de barras…"
                  className="w-full pl-10 pr-4 py-3 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
                  autoComplete="off"
                />
                {busqueda && (
                  <button
                    onClick={enfocarBuscador}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>

              <AnimatePresence>
                {resultados.length > 1 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="mt-2 border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 shadow-md"
                  >
                    {resultados.map((p) => (
                      <li key={p.id}>
                        <button
                          onClick={() => { agregarAlCarrito(p); enfocarBuscador() }}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-[#FF6B35]/5 transition-colors text-left group"
                        >
                          <div>
                            <span className="font-semibold text-[#1A1A2E] group-hover:text-[#FF6B35] transition-colors">
                              {p.nombre}
                            </span>
                            <span className="ml-2 font-mono text-[11px] text-gray-400">{p.sku}</span>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="font-black text-[#1A1A2E]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                              {formatPesos(p.precio)}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                              stock: {stockEnVivo[p.id] ?? p.stockActual}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Carrito */}
            <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
              <POSCarrito
                items={carrito}
                stockEnVivo={stockEnVivo}
                onCambiarCantidad={cambiarCantidad}
                onEliminar={eliminarItem}
              />
            </div>

            {carrito.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs text-gray-400">{totalItems} artículo{totalItems !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => setCarrito([])}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={12} /> Vaciar
                </button>
              </div>
            )}
          </div>

          {/* ── Columna derecha ── */}
          <div className="flex-[2] flex flex-col gap-4">

            {/* Total */}
            <div className="bg-[#1A1A2E] rounded-2xl p-6 text-center">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Total a cobrar</p>
              <p
                className="text-5xl font-black text-white tabular-nums"
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
              >
                {formatPesos(total)}
              </p>
              {totalItems > 0 && (
                <p className="text-xs text-white/30 mt-2">{totalItems} ítem{totalItems !== 1 ? 's' : ''}</p>
              )}
            </div>

            {/* Medio de pago */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Medio de pago</p>
              <div className="grid grid-cols-2 gap-2">
                {MEDIOS_PAGO.map(({ valor, label, Icono, color }) => {
                  const activo = medioPago === valor
                  const cls    = COLOR_MAP[color]
                  return (
                    <button
                      key={valor}
                      onClick={() => { setMedioPago(valor); setMontoRecibido('') }}
                      className={`flex flex-col items-center gap-2 py-3.5 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${
                        activo
                          ? cls.active
                          : 'border-gray-100 bg-[#F8F9FA] text-gray-500 hover:border-gray-200 hover:bg-white'
                      }`}
                    >
                      <Icono size={18} className={activo ? '' : 'text-gray-400'} />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Monto recibido / vuelto */}
            <AnimatePresence>
              {medioPago === 'EFECTIVO' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 overflow-hidden"
                >
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Monto recibido
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
                  />
                  {vuelto !== null && (
                    <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${
                      vuelto >= 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'
                    }`}>
                      <span className="text-sm font-semibold text-gray-600">Vuelto</span>
                      <span
                        className={`text-xl font-black ${vuelto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                        style={{ fontFamily: "'Rajdhani', sans-serif" }}
                      >
                        {formatPesos(vuelto)}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón cobrar */}
            <motion.button
              onClick={handleCobrar}
              disabled={cobrando || carrito.length === 0}
              whileTap={cobrando || carrito.length === 0 ? {} : { scale: 0.97 }}
              transition={{ duration: 0.1 }}
              className="w-full py-5 rounded-2xl text-white font-black text-xl tracking-wide transition-colors bg-[#FF6B35] hover:bg-[#e55a2b] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-200 flex items-center justify-center gap-3"
            >
              {cobrando ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Procesando…
                </>
              ) : (
                <>
                  <Zap size={20} />
                  COBRAR
                </>
              )}
            </motion.button>

          </div>
        </div>
      </main>

      {/* Modal ticket */}
      <AnimatePresence>
        {ticket && <ModalTicket ticket={ticket} onCerrar={cerrarTicket} />}
      </AnimatePresence>
    </div>
  )
}
