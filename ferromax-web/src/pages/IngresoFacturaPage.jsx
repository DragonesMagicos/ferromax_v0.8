import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import facturaService from '../services/facturaService'
import productoService from '../services/productoService'
import toast from 'react-hot-toast'
import {
  FileText, UploadCloud, Loader2, CheckCircle2, AlertCircle,
  Trash2, Link2, Link2Off, ChevronDown, Package, Clock, Building2,
} from 'lucide-react'

function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 2,
  })
}

// ── Badge de match ────────────────────────────────────────────────────────────
function BadgeMatch({ productoId, productoNombre, codigoSku }) {
  if (productoId) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
        <Link2 size={10} /> {productoNombre}
      </span>
    )
  }
  if (codigoSku && codigoSku.trim()) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold">
        <Link2 size={10} /> Por código
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">
      <Link2Off size={10} /> Sin vincular
    </span>
  )
}

// ── Selector de producto ──────────────────────────────────────────────────────
function SelectorProducto({ itemIdx, onSeleccionar }) {
  const [open, setOpen]           = useState(false)
  const [busqueda, setBusqueda]   = useState('')
  const [productos, setProductos] = useState([])
  const [cargando, setCargando]   = useState(false)
  const timerRef = useRef(null)

  const buscar = useCallback(async (q) => {
    if (q.trim().length < 2) { setProductos([]); return }
    setCargando(true)
    try {
      const todos = await productoService.listar()
      setProductos(
        todos
          .filter(p => p.activo !== false && (
            p.nombre.toLowerCase().includes(q.toLowerCase()) ||
            p.sku.toLowerCase().includes(q.toLowerCase())
          ))
          .slice(0, 8)
      )
    } catch {
      toast.error('Error al buscar productos')
    } finally {
      setCargando(false)
    }
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setBusqueda(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => buscar(val), 300)
  }

  const seleccionar = (p) => {
    onSeleccionar(itemIdx, p)
    setOpen(false)
    setBusqueda('')
    setProductos([])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-[11px] text-[#FF6B35] hover:underline font-semibold"
      >
        Vincular <ChevronDown size={10} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-3"
          >
            <input
              autoFocus
              type="text"
              value={busqueda}
              onChange={handleChange}
              placeholder="Buscar por nombre o SKU…"
              className="w-full text-sm px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
            />
            {cargando && (
              <div className="flex justify-center py-3">
                <Loader2 size={16} className="animate-spin text-[#FF6B35]" />
              </div>
            )}
            {productos.length > 0 && (
              <ul className="mt-2 divide-y divide-gray-50 max-h-48 overflow-y-auto">
                {productos.map(p => (
                  <li key={p.id}>
                    <button
                      onClick={() => seleccionar(p)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#FF6B35]/5 rounded-lg transition-colors"
                    >
                      <span className="font-semibold text-gray-800">{p.nombre}</span>
                      <span className="ml-2 font-mono text-[10px] text-gray-400">{p.sku}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Zona de drop ──────────────────────────────────────────────────────────────
function ZonaDrop({ onArchivo }) {
  const [arrastrando, setArrastrando] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setArrastrando(false)
    const file = e.dataTransfer.files[0]
    if (file) validarYEnviar(file)
  }

  const handleChange = (e) => {
    const file = e.target.files[0]
    if (file) validarYEnviar(file)
  }

  const validarYEnviar = (file) => {
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!tiposPermitidos.includes(file.type)) {
      toast.error('Solo se permiten PDF, JPG, PNG o WEBP')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('El archivo no puede superar 20 MB')
      return
    }
    onArchivo(file)
  }

  return (
    <motion.div
      onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      animate={{ borderColor: arrastrando ? '#FF6B35' : '#e5e7eb', backgroundColor: arrastrando ? '#fff5f1' : '#F8F9FA' }}
      className="border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 cursor-pointer transition-colors"
    >
      <input ref={inputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleChange} />
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${arrastrando ? 'bg-[#FF6B35]/20' : 'bg-gray-100'}`}>
        <UploadCloud size={28} className={arrastrando ? 'text-[#FF6B35]' : 'text-gray-400'} />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">Arrastrá la factura o hacé clic para seleccionar</p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG o WEBP · Máx. 20 MB</p>
      </div>
    </motion.div>
  )
}

// ── Tabla de items ────────────────────────────────────────────────────────────
function TablaItems({ items, onChange, onEliminar, onVincular }) {
  const actualizarCampo = (idx, campo, valor) => {
    onChange(idx, { ...items[idx], [campo]: valor })
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F8F9FA] border-b border-gray-100">
            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descripción</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</th>
            <th className="text-center px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cantidad</th>
            <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Precio unit.</th>
            <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Producto vinculado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item, idx) => (
            <tr key={idx} className={`group ${!item.productoId ? 'bg-amber-50/30' : ''}`}>
              <td className="px-4 py-3">
                <input
                  value={item.descripcion ?? ''}
                  onChange={e => actualizarCampo(idx, 'descripcion', e.target.value)}
                  className="w-full min-w-[160px] bg-transparent text-gray-800 font-medium focus:outline-none focus:bg-white focus:border focus:border-[#FF6B35]/30 rounded px-1 py-0.5"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  value={item.codigoSku ?? ''}
                  onChange={e => actualizarCampo(idx, 'codigoSku', e.target.value)}
                  className="w-full min-w-[80px] font-mono text-xs bg-transparent text-gray-500 focus:outline-none focus:bg-white focus:border focus:border-[#FF6B35]/30 rounded px-1 py-0.5"
                />
              </td>
              <td className="px-4 py-3 text-center">
                <input
                  type="number"
                  min="1"
                  value={item.cantidad ?? ''}
                  onChange={e => actualizarCampo(idx, 'cantidad', parseInt(e.target.value, 10) || 0)}
                  className="w-16 text-center bg-transparent font-bold text-gray-800 focus:outline-none focus:bg-white focus:border focus:border-[#FF6B35]/30 rounded px-1 py-0.5"
                />
              </td>
              <td className="px-4 py-3 text-right">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precioUnitario ?? ''}
                  onChange={e => actualizarCampo(idx, 'precioUnitario', parseFloat(e.target.value) || 0)}
                  className="w-28 text-right bg-transparent text-gray-700 focus:outline-none focus:bg-white focus:border focus:border-[#FF6B35]/30 rounded px-1 py-0.5"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <BadgeMatch productoId={item.productoId} productoNombre={item.productoNombre} codigoSku={item.codigoSku} />
                  <SelectorProducto
                    itemIdx={idx}
                    onSeleccionar={(i, p) => onVincular(i, p)}
                  />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEliminar(idx)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
}

const BADGE_ESTADO = {
  BORRADOR:   'bg-gray-100 text-gray-500',
  CONFIRMADA: 'bg-emerald-50 text-emerald-700',
  CANCELADA:  'bg-red-50 text-red-600',
}

export default function IngresoFacturaPage() {
  const [etapa, setEtapa]             = useState('upload')
  const [archivo, setArchivo]         = useState(null)
  const [analisis, setAnalisis]       = useState(null)
  const [facturaId, setFacturaId]     = useState(null)
  const [items, setItems]             = useState([])
  const [proveedor, setProveedor]     = useState('')
  const [nroFactura, setNroFactura]   = useState('')
  const [notas, setNotas]             = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [resultados, setResultados]   = useState([])
  const [historial, setHistorial]     = useState([])
  const [cargandoHist, setCargandoHist] = useState(false)

  const cargarHistorial = useCallback(async () => {
    setCargandoHist(true)
    try {
      const data = await facturaService.listar(0, 10)
      setHistorial(data.content ?? [])
    } catch { /* silencioso */ }
    finally { setCargandoHist(false) }
  }, [])

  // Cargar historial al montar
  useEffect(() => { cargarHistorial() }, [cargarHistorial])

  const handleArchivo = async (file) => {
    setArchivo(file)
    setEtapa('analizando')
    try {
      const res = await facturaService.analizar(file)
      setAnalisis(res)
      setFacturaId(res.facturaId ?? null)
      setItems(res.items ?? [])
      setProveedor(res.proveedor ?? '')
      setNroFactura(res.numeroFactura ?? '')
      if (res.numeroFactura) setNotas(`Factura N° ${res.numeroFactura}`)
      setEtapa('revision')
    } catch (err) {
      toast.error(err.response?.data?.mensaje ?? 'Error al analizar el documento')
      setEtapa('upload')
      setArchivo(null)
    }
  }

  const actualizarItem = (idx, nuevoItem) => {
    setItems(prev => prev.map((it, i) => i === idx ? nuevoItem : it))
  }

  const eliminarItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const vincularProducto = (idx, producto) => {
    setItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, productoId: producto.id, productoNombre: producto.nombre } : it
    ))
  }

  // Un ítem está listo si tiene productoId (vinculado manualmente) o codigoSku (para buscar por código)
  const tieneIdentificador = (it) => it.productoId || (it.codigoSku && it.codigoSku.trim())
  const sinVincular = items.filter(it => !tieneIdentificador(it)).length
  const conVincular = items.filter(it => tieneIdentificador(it) && it.cantidad > 0).length

  const handleConfirmar = async () => {
    if (conVincular === 0) {
      toast.error('Vinculá al menos un producto antes de confirmar')
      return
    }
    setConfirmando(true)
    try {
      const payload = items
        .filter(it => tieneIdentificador(it) && it.cantidad > 0)
        .map(it => ({ productoId: it.productoId ?? null, codigoSku: it.codigoSku ?? null, cantidad: it.cantidad, precioUnitario: it.precioUnitario }))

      const res = await facturaService.confirmar({ items: payload, notas, facturaId, proveedor, nroFactura })
      setResultados(res)
      cargarHistorial()
      setEtapa('confirmado')
      toast.success(`${res.length} producto(s) ingresados al stock`)
    } catch (err) {
      toast.error(err.response?.data?.mensaje ?? 'Error al confirmar el ingreso')
    } finally {
      setConfirmando(false)
    }
  }

  const reiniciar = () => {
    setEtapa('upload')
    setArchivo(null)
    setAnalisis(null)
    setFacturaId(null)
    setItems([])
    setProveedor('')
    setNroFactura('')
    setNotas('')
    setResultados([])
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 h-[72px] flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1A1A2E]">Ingreso por factura</h1>
            <p className="text-xs text-gray-400">Escaneá o subí una factura para ingresar mercadería automáticamente</p>
          </div>
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full space-y-6">

          {/* ── Upload ── */}
          {etapa === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8"
            >
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
                Subir factura del proveedor
              </p>
              <ZonaDrop onArchivo={handleArchivo} />
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { icon: FileText, label: 'PDF digital', desc: 'Factura en PDF del proveedor' },
                  { icon: UploadCloud, label: 'Foto / Escaneo', desc: 'JPG o PNG de factura impresa' },
                  { icon: Package, label: 'Detección automática', desc: 'Extrae items, cantidades y precios' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="bg-[#F8F9FA] rounded-xl p-4 flex items-start gap-3">
                    <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon size={13} className="text-violet-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-700">{label}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Analizando ── */}
          {etapa === 'analizando' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center gap-5"
            >
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-violet-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800">Analizando factura con IA…</p>
                <p className="text-sm text-gray-400 mt-1">
                  {archivo?.name} · Esto puede tardar unos segundos
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Revisión ── */}
          {etapa === 'revision' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Info editable de la factura */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                    <FileText size={13} className="text-violet-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Datos de la factura</p>
                  <span className="ml-auto text-[10px] text-violet-500 font-semibold">Podés editar los campos</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Proveedor</label>
                    <input
                      type="text"
                      value={proveedor}
                      onChange={e => setProveedor(e.target.value)}
                      placeholder="Nombre del proveedor…"
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">N° de Factura</label>
                    <input
                      type="text"
                      value={nroFactura}
                      onChange={e => setNroFactura(e.target.value)}
                      placeholder="Ej: 0001-00012345…"
                      className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-1 border-t border-gray-50">
                  <div className="text-center">
                    <p className="font-black text-lg text-gray-800" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      {items.length}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Items</p>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-lg text-emerald-600" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      {conVincular}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Vinculados</p>
                  </div>
                  {sinVincular > 0 && (
                    <div className="text-center">
                      <p className="font-black text-lg text-amber-500" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                        {sinVincular}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sin vincular</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Aviso productos sin vincular */}
              {sinVincular > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    <strong>{sinVincular} producto(s)</strong> no se vincularon automáticamente.
                    Usá el botón "Vincular" en cada fila para asignarlos manualmente. Solo se ingresarán al stock los productos vinculados.
                  </p>
                </div>
              )}

              {/* Tabla */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Items detectados — podés editar cualquier campo
                  </p>
                </div>
                <div className="p-5">
                  <TablaItems
                    items={items}
                    onChange={actualizarItem}
                    onEliminar={eliminarItem}
                    onVincular={vincularProducto}
                  />
                </div>
              </div>

              {/* Notas y botones */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Notas del ingreso
                  </label>
                  <input
                    type="text"
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    placeholder="Ej: Factura N° 0001-00012345, proveedor EPSA…"
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={reiniciar}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleConfirmar}
                    disabled={confirmando || conVincular === 0}
                    className="flex-[2] py-3 rounded-xl bg-[#FF6B35] text-white font-bold text-sm hover:bg-[#e55a2b] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {confirmando ? (
                      <><Loader2 size={16} className="animate-spin" /> Confirmando ingreso…</>
                    ) : (
                      <><CheckCircle2 size={16} /> Confirmar ingreso de {conVincular} producto(s)</>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Confirmado ── */}
          {etapa === 'confirmado' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="bg-emerald-500 px-6 py-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-base">Ingreso confirmado</p>
                  <p className="text-white/70 text-sm">{resultados.length} producto(s) actualizados en stock</p>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {resultados.map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#F8F9FA] rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{r.nombreProducto}</p>
                      <p className="text-xs text-gray-400 font-mono">{r.sku}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{r.stockAnterior}</span>
                      <span className="text-gray-300">→</span>
                      <span className="font-bold text-emerald-600">{r.stockNuevo}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={reiniciar}
                  className="w-full py-3 rounded-xl bg-[#1A1A2E] text-white text-sm font-bold hover:bg-[#2a2a4e] transition-colors"
                >
                  Ingresar otra factura
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Historial ── */}
          {etapa === 'upload' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Historial de facturas</p>
                </div>
                {cargandoHist && <Loader2 size={13} className="animate-spin text-gray-300" />}
              </div>
              {historial.length === 0 && !cargandoHist ? (
                <p className="text-xs text-gray-400 text-center py-8">No hay facturas registradas aún</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-gray-50">
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">N° Factura</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proveedor</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Archivo</th>
                      <th className="text-center px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {historial.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700 font-semibold">
                          {f.numeroFactura ?? <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={12} className="text-gray-300 shrink-0" />
                            <span className="text-xs text-gray-600 truncate max-w-[160px]">
                              {f.proveedorNombre ?? <span className="text-gray-300">Sin identificar</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[140px]">
                          {f.archivoNombre ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-bold text-gray-600">{f.cantidadItems}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${BADGE_ESTADO[f.estado] ?? ''}`}>
                            {f.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{formatFecha(f.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
