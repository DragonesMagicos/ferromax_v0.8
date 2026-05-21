import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import productoService from '../services/productoService'
import recepcionService from '../services/recepcionService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Search, Loader2, Package, CheckCircle2, RotateCcw, Truck } from 'lucide-react'

function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  })
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Panel de confirmación ─────────────────────────────────────────────────────

function PanelConfirmacion({ resultado, onNuevo }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="bg-emerald-500 px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
          <CheckCircle2 size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Recepción registrada</p>
          <p className="text-white/70 text-xs">{formatFecha(resultado.fecha)}</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F8F9FA] rounded-xl p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Producto</p>
            <p className="text-sm font-semibold text-gray-800">{resultado.nombreProducto}</p>
            <p className="text-xs text-gray-400 font-mono">{resultado.sku}</p>
          </div>
          <div className="bg-[#F8F9FA] rounded-xl p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cantidad recibida</p>
            <p className="text-2xl font-black text-emerald-600" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              +{resultado.cantidadRecibida}
            </p>
          </div>
        </div>

        <div className="bg-[#F8F9FA] rounded-xl p-4 flex items-center justify-between">
          <div className="text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Stock anterior</p>
            <p className="text-xl font-bold text-gray-500">{resultado.stockAnterior}</p>
          </div>
          <div className="text-2xl text-gray-300">→</div>
          <div className="text-center">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Stock nuevo</p>
            <p className="text-xl font-bold text-emerald-600">{resultado.stockNuevo}</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <button
          onClick={onNuevo}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1A1A2E] text-white text-sm font-bold hover:bg-[#2a2a4e] transition-colors"
        >
          <RotateCcw size={14} />
          Recibir otro producto
        </button>
      </div>
    </motion.div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RecepcionPage() {
  const { isAdmin } = useAuth()
  const esAdmin = isAdmin()

  const [busqueda, setBusqueda]       = useState('')
  const [buscando, setBuscando]       = useState(false)
  const [resultados, setResultados]   = useState([])
  const [productoSel, setProductoSel] = useState(null)
  const [cantidad, setCantidad]       = useState('')
  const [notas, setNotas]             = useState('')
  const [guardando, setGuardando]     = useState(false)
  const [resultado, setResultado]     = useState(null)

  const inputRef    = useRef(null)
  const busqTimer   = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const limpiarBusqueda = useCallback(() => {
    setBusqueda('')
    setResultados([])
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const seleccionarProducto = useCallback((p) => {
    setProductoSel(p)
    setBusqueda('')
    setResultados([])
    setCantidad('')
    setNotas('')
  }, [])

  const buscar = useCallback(async (q) => {
    if (q.trim().length < 2) { setResultados([]); return }
    setBuscando(true)
    try {
      const listar = esAdmin ? productoService.listar : productoService.listarEmpleado.bind(productoService)
      const todos = await listar()
      const coincidencias = todos.filter(
        (p) => p.activo !== false && (
          p.nombre.toLowerCase().includes(q.toLowerCase()) ||
          p.sku.toLowerCase().includes(q.toLowerCase())
        )
      )
      setResultados(coincidencias.slice(0, 8))
    } catch {
      toast.error('Error al buscar productos')
    } finally {
      setBuscando(false)
    }
  }, [esAdmin])

  const handleChangeBusqueda = (e) => {
    const val = e.target.value
    setBusqueda(val)
    clearTimeout(busqTimer.current)
    busqTimer.current = setTimeout(() => buscar(val), 350)
  }

  const handleGuardar = async () => {
    if (!productoSel)         { toast.error('Seleccioná un producto'); return }
    const cant = parseInt(cantidad, 10)
    if (!cant || cant <= 0)   { toast.error('Ingresá una cantidad válida'); return }

    setGuardando(true)
    try {
      const res = await recepcionService.recibir({
        productoId: productoSel.id,
        cantidad: cant,
        notas: notas.trim() || null,
      })
      setResultado(res)
      setProductoSel(null)
    } catch (err) {
      const msg = err.response?.data?.mensaje ?? 'Error al registrar la recepción'
      toast.error(msg)
    } finally {
      setGuardando(false)
    }
  }

  const handleNuevo = () => {
    setResultado(null)
    setCantidad('')
    setNotas('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 h-[72px] flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Truck size={18} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1A1A2E]">Recepción de mercadería</h1>
            <p className="text-xs text-gray-400">Registrá el ingreso de stock manualmente</p>
          </div>
        </header>

        <div className="p-8 max-w-xl mx-auto w-full space-y-5">

          {resultado ? (
            <PanelConfirmacion resultado={resultado} onNuevo={handleNuevo} />
          ) : (
            <>

              {/* Buscador de producto */}
              {!productoSel && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Buscar producto
                  </p>
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
                      placeholder="Nombre o SKU del producto…"
                      className="w-full pl-10 pr-4 py-3 bg-[#F8F9FA] border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
                      autoComplete="off"
                    />
                  </div>

                  <AnimatePresence>
                    {resultados.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden"
                      >
                        {resultados.map((p) => (
                          <li key={p.id}>
                            <button
                              onClick={() => seleccionarProducto(p)}
                              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-[#FF6B35]/5 transition-colors text-left group"
                            >
                              <div>
                                <span className="font-semibold text-gray-800 group-hover:text-[#FF6B35] transition-colors">
                                  {p.nombre}
                                </span>
                                <span className="ml-2 font-mono text-[11px] text-gray-400">{p.sku}</span>
                              </div>
                              <span className="text-xs text-gray-400 ml-4 shrink-0">
                                stock: {p.stockActual}
                              </span>
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Producto seleccionado */}
              {productoSel && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4"
                >
                  {/* Info producto + botón cambiar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center shrink-0">
                        <Package size={16} className="text-[#FF6B35]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{productoSel.nombre}</p>
                        <p className="text-xs text-gray-400 font-mono">{productoSel.sku}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setProductoSel(null); limpiarBusqueda() }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-[#F8F9FA] rounded-xl px-4 py-3">
                    <span className="text-xs text-gray-500">Stock actual</span>
                    <span className="font-bold text-gray-700">{productoSel.stockActual}</span>
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Cantidad a ingresar
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      placeholder="0"
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
                      autoFocus
                    />
                    {cantidad && parseInt(cantidad, 10) > 0 && (
                      <p className="text-xs text-emerald-600 mt-1.5">
                        Nuevo stock estimado: {productoSel.stockActual + parseInt(cantidad, 10)}
                      </p>
                    )}
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                      Notas <span className="font-normal normal-case">(opcional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Ej: Remito N° 1234, proveedor EPSA…"
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
                    />
                  </div>

                  {/* Confirmar */}
                  <motion.button
                    onClick={handleGuardar}
                    disabled={guardando || !cantidad || parseInt(cantidad, 10) <= 0}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 rounded-xl bg-[#FF6B35] text-white font-bold text-sm hover:bg-[#e55a2b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {guardando ? (
                      <><Loader2 size={16} className="animate-spin" /> Registrando…</>
                    ) : (
                      <><CheckCircle2 size={16} /> Confirmar recepción</>
                    )}
                  </motion.button>
                </motion.div>
              )}

            </>
          )}
        </div>
      </main>
    </div>
  )
}
