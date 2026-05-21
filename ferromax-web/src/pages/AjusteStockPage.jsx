import { useEffect, useState, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import ajusteStockService from '../services/ajusteStockService'
import productoService from '../services/productoService'
import toast from 'react-hot-toast'
import {
  SlidersHorizontal, Search, TrendingUp, TrendingDown,
  Loader2, ChevronLeft, ChevronRight, History
} from 'lucide-react'

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Buscador de producto con debounce ─────────────────────────────────────────
function BuscadorProducto({ onSeleccionar }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (query.trim().length < 2) { setResultados([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const todos = await productoService.listar()
        const q = query.toLowerCase()
        setResultados(
          todos.filter(p =>
            p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
          ).slice(0, 8)
        )
      } catch { setResultados([]) }
      finally { setBuscando(false) }
    }, 300)
  }, [query])

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscá por nombre o SKU..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50"
        />
        {buscando && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />
        )}
      </div>
      {resultados.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-[#1E1E32] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {resultados.map(p => (
            <button
              key={p.id}
              onClick={() => { onSeleccionar(p); setQuery(''); setResultados([]) }}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 text-left transition-colors"
            >
              <div>
                <p className="text-white text-sm font-medium">{p.nombre}</p>
                <p className="text-white/40 text-xs">{p.sku}</p>
              </div>
              <span className="text-white/50 text-xs">{p.stockActual} u</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Formulario de ajuste ──────────────────────────────────────────────────────
function FormularioAjuste({ onAjustado }) {
  const [producto, setProducto] = useState(null)
  const [tipo, setTipo] = useState('entrada') // 'entrada' | 'salida'
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [cargando, setCargando] = useState(false)

  const cantidadNum = parseInt(cantidad) || 0
  const delta = tipo === 'entrada' ? cantidadNum : -cantidadNum
  const stockResultante = producto ? producto.stockActual + delta : null

  async function enviar(e) {
    e.preventDefault()
    if (!producto) return toast.error('Seleccioná un producto')
    if (cantidadNum <= 0) return toast.error('Ingresá una cantidad válida')
    if (!motivo.trim()) return toast.error('El motivo es obligatorio')
    if (stockResultante < 0) return toast.error('El ajuste dejaría el stock en negativo')

    setCargando(true)
    try {
      await ajusteStockService.ajustar({
        productoId: producto.id,
        cantidad: delta,
        motivo: motivo.trim()
      })
      toast.success('Ajuste registrado correctamente')
      setProducto(null)
      setCantidad('')
      setMotivo('')
      setTipo('entrada')
      onAjustado()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al registrar el ajuste')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-5">
      <h2 className="text-white font-bold text-base">Nuevo ajuste</h2>

      {/* Buscador */}
      <div>
        <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">Producto</label>
        {producto ? (
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
            <div>
              <p className="text-white font-medium text-sm">{producto.nombre}</p>
              <p className="text-white/40 text-xs">SKU: {producto.sku} · Stock actual: {producto.stockActual} u</p>
            </div>
            <button
              type="button"
              onClick={() => setProducto(null)}
              className="text-white/30 hover:text-white/60 text-xs underline"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <BuscadorProducto onSeleccionar={setProducto} />
        )}
      </div>

      {/* Tipo */}
      <div>
        <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">Tipo de ajuste</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTipo('entrada')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tipo === 'entrada'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10'
            }`}
          >
            <TrendingUp size={14} /> Entrada (+)
          </button>
          <button
            type="button"
            onClick={() => setTipo('salida')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tipo === 'salida'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10'
            }`}
          >
            <TrendingDown size={14} /> Salida (−)
          </button>
        </div>
      </div>

      {/* Cantidad */}
      <div>
        <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">Cantidad</label>
        <input
          type="number"
          min="1"
          value={cantidad}
          onChange={e => setCantidad(e.target.value)}
          placeholder="0"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50"
        />
        {producto && cantidadNum > 0 && (
          <p className={`text-xs mt-1.5 ${stockResultante < 0 ? 'text-red-400' : 'text-white/40'}`}>
            Stock resultante: {producto.stockActual} → <strong>{stockResultante}</strong> u
          </p>
        )}
      </div>

      {/* Motivo */}
      <div>
        <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">Motivo (requerido)</label>
        <textarea
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          rows={2}
          placeholder="Ej: Diferencia de inventario, merma, devolución a proveedor..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50"
        />
      </div>

      <button
        type="submit"
        disabled={cargando || !producto}
        className="w-full py-3 bg-[#FF6B35] hover:bg-[#e85d2a] disabled:opacity-40 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {cargando ? <Loader2 size={16} className="animate-spin" /> : <SlidersHorizontal size={16} />}
        Registrar ajuste
      </button>
    </form>
  )
}

// ── Historial ─────────────────────────────────────────────────────────────────
function Historial({ refreshKey }) {
  const [ajustes, setAjustes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setCargando(true)
    ajusteStockService.listar(page)
      .then(data => {
        setAjustes(data.content)
        setTotalPages(data.totalPages)
      })
      .catch(() => toast.error('Error al cargar el historial'))
      .finally(() => setCargando(false))
  }, [page, refreshKey])

  if (cargando) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={24} className="animate-spin text-[#FF6B35]" />
    </div>
  )

  if (ajustes.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <History size={36} className="text-white/10" />
      <p className="text-white/30 text-sm">Sin ajustes registrados aún</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {ajustes.map(a => {
        const esEntrada = a.cantidad > 0
        return (
          <div key={a.movimientoId} className="bg-white/[0.03] border border-white/8 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              esEntrada ? 'bg-green-500/15' : 'bg-red-500/15'
            }`}>
              {esEntrada
                ? <TrendingUp size={16} className="text-green-400" />
                : <TrendingDown size={16} className="text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{a.nombreProducto}</p>
              <p className="text-white/40 text-xs">{a.sku} · {a.motivo}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`font-bold text-sm ${esEntrada ? 'text-green-400' : 'text-red-400'}`}>
                {esEntrada ? '+' : ''}{a.cantidad}
              </p>
              <p className="text-white/25 text-xs">{a.stockAnterior} → {a.stockNuevo}</p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-white/40 text-xs">{formatFecha(a.fecha)}</p>
              <p className="text-white/25 text-xs">{a.nombreAdmin ?? '—'}</p>
            </div>
          </div>
        )
      })}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={14} className="text-white/60" />
          </button>
          <span className="text-white/40 text-sm">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <ChevronRight size={14} className="text-white/60" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AjusteStockPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex min-h-screen bg-[#12121E]">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 overflow-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6B35]/15 rounded-xl flex items-center justify-center">
            <SlidersHorizontal size={18} className="text-[#FF6B35]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-xl">Ajuste de stock</h1>
            <p className="text-white/40 text-sm">Correcciones manuales por diferencias, mermas o devoluciones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Formulario */}
          <FormularioAjuste onAjustado={() => setRefreshKey(k => k + 1)} />

          {/* Historial */}
          <div className="space-y-4">
            <h2 className="text-white/60 text-sm font-semibold uppercase tracking-widest flex items-center gap-2">
              <History size={14} /> Historial de ajustes
            </h2>
            <Historial refreshKey={refreshKey} />
          </div>
        </div>

      </main>
    </div>
  )
}
