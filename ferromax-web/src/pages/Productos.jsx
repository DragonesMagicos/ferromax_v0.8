import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import productoService from '../services/productoService'
import toast from 'react-hot-toast'
import {
  Plus, Search, Package, Scan, Pencil, PowerOff,
  AlertTriangle, CheckCircle2, X, Loader2,
} from 'lucide-react'

function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

// ── Campo genérico ────────────────────────────────────────────────────────────
function Campo({ label, hint, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
      />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

// ── Campo de código de barras con soporte de escáner ─────────────────────────
function CampoBarcode({ value, onChange }) {
  const ref = useRef(null)
  const scanStart = useRef(null)

  const handleChange = (e) => {
    if (scanStart.current === null && e.target.value.length > 0) {
      scanStart.current = Date.now()
    }
    onChange(e.target.value)
  }

  const handleKeyDown = (e) => {
    // Escáner envía Enter al final — sólo movemos el foco al siguiente campo
    if (e.key === 'Enter') {
      e.preventDefault()
      const form = e.target.closest('form')
      const fields = Array.from(form.querySelectorAll('input, select, textarea, button'))
      const idx = fields.indexOf(e.target)
      fields[idx + 1]?.focus()
      scanStart.current = null
    }
  }

  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
        Código de barras
      </label>
      <div className="relative">
        <Scan size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribí o escaneá con el lector…"
          autoComplete="off"
          className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors font-mono"
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Podés escanear directamente con el lector de código de barras</p>
    </div>
  )
}

// ── Modal crear / editar ──────────────────────────────────────────────────────
const FORM_VACIO = {
  sku: '', codigoBarras: '', nombre: '', descripcion: '',
  precio: '', precioCompra: '', stockMinimo: '',
  imagenUrl: '', categoriaId: '', proveedorId: '',
}

function ModalProducto({ producto, onGuardar, onCerrar }) {
  const esEdicion = Boolean(producto?.id)
  const [form, setForm] = useState(() => {
    if (esEdicion) {
      return {
        nombre:       producto.nombre ?? '',
        precio:       producto.precio ?? '',
        stockMinimo:  producto.stockMinimo ?? '',
        imagenUrl:    producto.imagenUrl ?? '',
        codigoBarras: producto.codigoBarras ?? '',
      }
    }
    return { ...FORM_VACIO }
  })
  const [guardando, setGuardando] = useState(false)

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))
  const setVal = (campo) => (val) => setForm((f) => ({ ...f, [campo]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      if (esEdicion) {
        const payload = {
          nombre:       form.nombre       || undefined,
          precio:       form.precio !== '' ? Number(form.precio) : undefined,
          stockMinimo:  form.stockMinimo !== '' ? Number(form.stockMinimo) : undefined,
          imagenUrl:    form.imagenUrl    || undefined,
          codigoBarras: form.codigoBarras || undefined,
        }
        const actualizado = await productoService.actualizar(producto.id, payload)
        onGuardar(actualizado, true)
      } else {
        const payload = {
          sku:          form.sku,
          codigoBarras: form.codigoBarras || undefined,
          nombre:       form.nombre,
          descripcion:  form.descripcion  || undefined,
          precio:       Number(form.precio),
          precioCompra: form.precioCompra !== '' ? Number(form.precioCompra) : undefined,
          stockMinimo:  form.stockMinimo !== '' ? Number(form.stockMinimo) : undefined,
          imagenUrl:    form.imagenUrl    || undefined,
          categoriaId:  form.categoriaId !== '' ? Number(form.categoriaId) : undefined,
          proveedorId:  form.proveedorId !== '' ? Number(form.proveedorId) : undefined,
        }
        const creado = await productoService.crear(payload)
        onGuardar(creado, false)
      }
    } catch (err) {
      toast.error(err.response?.data?.mensaje ?? 'Error al guardar el producto')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center">
              <Package size={16} className="text-[#FF6B35]" />
            </div>
            <h2 className="font-bold text-[#1A1A2E]">
              {esEdicion ? 'Editar producto' : 'Nuevo producto'}
            </h2>
          </div>
          <button
            onClick={onCerrar}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!esEdicion && (
            <div className="grid grid-cols-2 gap-4">
              <Campo label="SKU *" value={form.sku} onChange={set('sku')} required placeholder="ej. TOR-M6" />
              <Campo label="Categoría ID" value={form.categoriaId} onChange={set('categoriaId')} placeholder="ej. 1" type="number" />
            </div>
          )}

          <Campo label="Nombre *" value={form.nombre} onChange={set('nombre')} required placeholder="Nombre del producto" />

          {/* Código de barras — aparece tanto en crear como en editar */}
          <CampoBarcode value={form.codigoBarras} onChange={setVal('codigoBarras')} />

          {!esEdicion && (
            <Campo label="Descripción" value={form.descripcion} onChange={set('descripcion')} placeholder="Descripción opcional" />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Campo
              label="Precio venta (ARS) *"
              value={form.precio} onChange={set('precio')}
              required type="number" min="0" step="0.01" placeholder="0.00"
            />
            {!esEdicion
              ? <Campo label="Precio compra (ARS)" value={form.precioCompra} onChange={set('precioCompra')} type="number" min="0" step="0.01" placeholder="0.00" />
              : <Campo label="Stock mínimo" value={form.stockMinimo} onChange={set('stockMinimo')} type="number" min="0" placeholder="ej. 5" />
            }
          </div>

          {!esEdicion && (
            <div className="grid grid-cols-2 gap-4">
              <Campo label="Stock mínimo" value={form.stockMinimo} onChange={set('stockMinimo')} type="number" min="0" placeholder="ej. 5" />
              <Campo label="Proveedor ID" value={form.proveedorId} onChange={set('proveedorId')} type="number" placeholder="ej. 1" />
            </div>
          )}

          <Campo label="URL imagen" value={form.imagenUrl} onChange={set('imagenUrl')} placeholder="https://..." />

          <div className="flex justify-end gap-3 pt-2 sticky bottom-0 bg-white pb-1">
            <button
              type="button" onClick={onCerrar}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors rounded-xl hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={guardando}
              className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-[#FF6B35] hover:bg-[#e55a2b] active:scale-95 text-white rounded-full transition-colors disabled:opacity-50"
            >
              {guardando && <Loader2 size={14} className="animate-spin" />}
              {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Modal confirmar desactivar ─────────────────────────────────────────────────
function ModalConfirmar({ producto, onConfirmar, onCerrar }) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <h2 className="font-bold text-[#1A1A2E]">Desactivar producto</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          ¿Desactivar <strong className="text-[#1A1A2E]">{producto.nombre}</strong>? No aparecerá en el catálogo ni en el POS, pero no se elimina.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onCerrar}
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button
            onClick={async () => { setLoading(true); try { await onConfirmar() } finally { setLoading(false) } }}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {loading ? 'Desactivando…' : 'Desactivar'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Badge de stock ─────────────────────────────────────────────────────────────
function StockBadge({ p }) {
  if (p.stockActual === 0)
    return <span className="text-[11px] font-bold text-red-500 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">Sin stock</span>
  if (p.stockActual <= p.stockMinimo)
    return <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">Crítico</span>
  return <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">OK</span>
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ProductosPage() {
  const [productos, setProductos]               = useState([])
  const [cargando, setCargando]                 = useState(true)
  const [busqueda, setBusqueda]                 = useState('')
  const [soloActivos, setSoloActivos]           = useState(true)
  const [modalCrear, setModalCrear]             = useState(false)
  const [productoEditar, setProductoEditar]     = useState(null)
  const [productoDesactivar, setProductoDesactivar] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      setProductos(await productoService.listar())
    } catch {
      toast.error('No se pudieron cargar los productos')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const productosFiltrados = productos.filter((p) => {
    if (soloActivos && !p.activo) return false
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.codigoBarras ?? '').includes(q) ||
      (p.nombreCategoria ?? '').toLowerCase().includes(q)
    )
  })

  const handleGuardar = (producto, esEdicion) => {
    if (esEdicion) {
      setProductos((prev) => prev.map((p) => p.id === producto.id ? producto : p))
      toast.success('Producto actualizado', {
        style: { borderRadius: '12px', background: '#1A1A2E', color: '#fff' },
        iconTheme: { primary: '#FF6B35', secondary: '#fff' },
      })
    } else {
      setProductos((prev) => [producto, ...prev])
      toast.success('Producto creado', {
        style: { borderRadius: '12px', background: '#1A1A2E', color: '#fff' },
        iconTheme: { primary: '#FF6B35', secondary: '#fff' },
      })
    }
    setModalCrear(false)
    setProductoEditar(null)
  }

  const handleDesactivar = async () => {
    await productoService.desactivar(productoDesactivar.id)
    setProductos((prev) => prev.map((p) => p.id === productoDesactivar.id ? { ...p, activo: false } : p))
    toast.success('Producto desactivado')
    setProductoDesactivar(null)
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 h-[72px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center">
              <Package size={18} className="text-[#FF6B35]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#1A1A2E]">Productos</h1>
              <p className="text-xs text-gray-400">{productos.length} productos en total</p>
            </div>
          </div>
          <button
            onClick={() => setModalCrear(true)}
            className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e55a2b] active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
          >
            <Plus size={15} /> Nuevo producto
          </button>
        </header>

        <div className="p-8 space-y-5 max-w-7xl mx-auto w-full">

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU, código de barras o categoría…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-colors"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none bg-white border border-gray-200 rounded-xl px-4 py-2.5">
              <input
                type="checkbox"
                checked={soloActivos}
                onChange={(e) => setSoloActivos(e.target.checked)}
                className="accent-[#FF6B35]"
              />
              Solo activos
            </label>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5">
              <span className="text-sm text-gray-400">
                {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {cargando ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 size={28} className="animate-spin text-[#FF6B35]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left">
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">SKU</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nombre</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><Scan size={11} /> Código</span>
                      </th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Categoría</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Precio</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Stock</th>
                      <th className="px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Estado</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {productosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-14 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                              <Package size={28} className="text-gray-300" />
                            </div>
                            <p className="text-sm text-gray-400">No se encontraron productos</p>
                          </div>
                        </td>
                      </tr>
                    ) : productosFiltrados.map((p) => (
                      <tr key={p.id} className={`hover:bg-gray-50/60 transition-colors ${!p.activo ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{p.sku}</td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-[#1A1A2E]">{p.nombre}</div>
                          {p.nombreProveedor && (
                            <div className="text-xs text-gray-400 mt-0.5">{p.nombreProveedor}</div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {p.codigoBarras ? (
                            <span className="flex items-center gap-1.5 font-mono text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg w-fit">
                              <Scan size={10} className="text-[#FF6B35]" />
                              {p.codigoBarras}
                            </span>
                          ) : (
                            <button
                              onClick={() => setProductoEditar(p)}
                              className="text-xs text-gray-300 hover:text-[#FF6B35] transition-colors flex items-center gap-1"
                            >
                              <Plus size={10} /> agregar
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">{p.nombreCategoria ?? '—'}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="font-black text-[#1A1A2E]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                            {formatPesos(p.precio)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <StockBadge p={p} />
                            <span className="text-[11px] text-gray-400">
                              {p.stockActual} / {p.stockMinimo} mín
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {p.activo ? (
                            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full w-fit mx-auto">
                              <CheckCircle2 size={10} /> Activo
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                              Inactivo
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setProductoEditar(p)}
                              className="w-8 h-8 rounded-xl hover:bg-[#FF6B35]/10 flex items-center justify-center transition-colors group"
                              title="Editar"
                            >
                              <Pencil size={13} className="text-gray-400 group-hover:text-[#FF6B35] transition-colors" />
                            </button>
                            {p.activo && (
                              <button
                                onClick={() => setProductoDesactivar(p)}
                                className="w-8 h-8 rounded-xl hover:bg-red-50 flex items-center justify-center transition-colors group"
                                title="Desactivar"
                              >
                                <PowerOff size={13} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {(modalCrear || productoEditar) && (
          <ModalProducto
            producto={productoEditar}
            onGuardar={handleGuardar}
            onCerrar={() => { setModalCrear(false); setProductoEditar(null) }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {productoDesactivar && (
          <ModalConfirmar
            producto={productoDesactivar}
            onConfirmar={handleDesactivar}
            onCerrar={() => setProductoDesactivar(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
