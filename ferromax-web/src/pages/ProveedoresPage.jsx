import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import {
  Building2, Plus, Pencil, Trash2, X, Check, ChevronRight,
  FileText, Phone, Mail, CreditCard, ArrowLeft, Loader2,
  ShieldCheck, Clock,
} from 'lucide-react'
import api from '../services/api'

const BADGE_ESTADO = {
  BORRADOR:   'bg-gray-100 text-gray-500',
  CONFIRMADA: 'bg-emerald-50 text-emerald-700',
  CANCELADA:  'bg-red-50 text-red-600',
}

function formatFecha(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const VACIO = { nombre: '', ruc: '', telefono: '', email: '', condicionPago: '', lineaCredito: '' }

// ── Modal alta/edición ────────────────────────────────────────────────────────
function ModalProveedor({ proveedor, onGuardar, onCerrar }) {
  const [form, setForm] = useState(proveedor ? {
    nombre: proveedor.nombre ?? '',
    ruc: proveedor.ruc ?? '',
    telefono: proveedor.telefono ?? '',
    email: proveedor.email ?? '',
    condicionPago: proveedor.condicionPago ?? '',
    lineaCredito: proveedor.lineaCredito ?? '',
  } : { ...VACIO })
  const [guardando, setGuardando] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setGuardando(true)
    try {
      const body = { ...form, lineaCredito: form.lineaCredito !== '' ? form.lineaCredito : null }
      if (proveedor) {
        const { data } = await api.put(`/proveedores/${proveedor.id}`, body)
        onGuardar(data)
      } else {
        const { data } = await api.post('/proveedores', body)
        onGuardar(data)
      }
    } catch {
      toast.error('Error al guardar el proveedor')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-violet-600" />
            </div>
            <h2 className="font-bold text-gray-800 text-sm">
              {proveedor ? 'Editar proveedor' : 'Nuevo proveedor'}
            </h2>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nombre / Razón social *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                placeholder="Ej: Extra Power S.A." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">CUIT</label>
              <input value={form.ruc} onChange={e => set('ruc', e.target.value)}
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                placeholder="xx-xxxxxxxx-x" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                placeholder="Ej: 011-4444-5555" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                placeholder="ventas@proveedor.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Condición de pago</label>
              <input value={form.condicionPago} onChange={e => set('condicionPago', e.target.value)}
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                placeholder="Ej: 30 días" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Línea de crédito ($)</label>
              <input type="number" value={form.lineaCredito} onChange={e => set('lineaCredito', e.target.value)}
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                placeholder="0.00" />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-[2] py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {guardando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {proveedor ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Vista de facturas de un proveedor ─────────────────────────────────────────
function FacturasProveedor({ proveedor, onVolver }) {
  const [facturas, setFacturas] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    api.get(`/proveedores/${proveedor.id}/facturas`)
      .then(r => setFacturas(r.data))
      .catch(() => toast.error('Error al cargar facturas'))
      .finally(() => setCargando(false))
  }, [proveedor.id])

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
          <button onClick={onVolver}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
            <ArrowLeft size={16} />
          </button>
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
            <Building2 size={13} className="text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">{proveedor.nombre}</p>
            {proveedor.ruc && <p className="text-[11px] text-gray-400 font-mono">{proveedor.ruc}</p>}
          </div>
        </div>

        {cargando ? (
          <div className="flex justify-center py-12">
            <Loader2 size={22} className="animate-spin text-violet-500" />
          </div>
        ) : facturas.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-10">Este proveedor no tiene facturas registradas</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-gray-50">
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">N° Factura</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {facturas.map(f => (
                <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 font-semibold">
                    {f.numeroFactura ?? <span className="text-gray-300">—</span>}
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
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">{f.notas ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([])
  const [cargando, setCargando]       = useState(true)
  const [modal, setModal]             = useState(null)   // null | 'nuevo' | proveedor
  const [viendo, setViendo]           = useState(null)   // proveedor seleccionado para ver facturas
  const [buscando, setBuscando]       = useState('')
  const [eliminando, setEliminando]   = useState(null)

  const cargar = useCallback(() => {
    setCargando(true)
    api.get('/proveedores')
      .then(r => setProveedores(r.data))
      .catch(() => toast.error('Error al cargar proveedores'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handleGuardar = (prov) => {
    setProveedores(prev => {
      const idx = prev.findIndex(p => p.id === prov.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = prov; return next }
      return [...prev, prov].sort((a, b) => a.nombre.localeCompare(b.nombre))
    })
    toast.success(modal === 'nuevo' ? 'Proveedor creado' : 'Proveedor actualizado')
    setModal(null)
  }

  const handleEliminar = async (prov) => {
    setEliminando(prov.id)
    try {
      await api.delete(`/proveedores/${prov.id}`)
      setProveedores(prev => prev.filter(p => p.id !== prov.id))
      toast.success('Proveedor eliminado')
    } catch {
      toast.error('No se pudo eliminar el proveedor')
    } finally {
      setEliminando(null)
    }
  }

  const filtrados = proveedores.filter(p =>
    p.nombre?.toLowerCase().includes(buscando.toLowerCase()) ||
    p.ruc?.includes(buscando)
  )

  if (viendo) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FA]">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-auto">
          <header className="bg-white border-b border-gray-100 px-8 h-[72px] flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-violet-500" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#1A1A2E]">Facturas del proveedor</h1>
              <p className="text-xs text-gray-400">Historial de compras registradas</p>
            </div>
          </header>
          <div className="p-8 max-w-5xl mx-auto w-full">
            <FacturasProveedor proveedor={viendo} onVolver={() => setViendo(null)} />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <AnimatePresence>
        {modal && (
          <ModalProveedor
            proveedor={modal === 'nuevo' ? null : modal}
            onGuardar={handleGuardar}
            onCerrar={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-auto">
        <header className="bg-white border-b border-gray-100 px-8 h-[72px] flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-violet-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1A1A2E]">Proveedores</h1>
            <p className="text-xs text-gray-400">Gestión de proveedores y sus facturas</p>
          </div>
          <button
            onClick={() => setModal('nuevo')}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-xs font-bold rounded-xl hover:bg-violet-700 transition-colors"
          >
            <Plus size={13} /> Nuevo proveedor
          </button>
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full space-y-4">

          {/* Buscador */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <Building2 size={15} className="text-gray-300 shrink-0" />
            <input
              value={buscando}
              onChange={e => setBuscando(e.target.value)}
              placeholder="Buscar por nombre o CUIT…"
              className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-300"
            />
          </div>

          {/* Lista */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {cargando ? (
              <div className="flex justify-center py-16">
                <Loader2 size={24} className="animate-spin text-violet-500" />
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-gray-300">
                <Building2 size={32} />
                <p className="text-sm">
                  {buscando ? 'Sin resultados para esa búsqueda' : 'No hay proveedores registrados'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Proveedor</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">CUIT</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contacto</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cond. pago</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtrados.map(p => (
                    <tr key={p.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                            <Building2 size={13} className="text-violet-600" />
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">{p.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {p.ruc
                          ? <span className="font-mono text-xs text-gray-500 flex items-center gap-1"><ShieldCheck size={11} className="text-emerald-500" />{p.ruc}</span>
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          {p.telefono && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} className="text-gray-300" />{p.telefono}</span>}
                          {p.email && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} className="text-gray-300" />{p.email}</span>}
                          {!p.telefono && !p.email && <span className="text-gray-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">
                        {p.condicionPago ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setViendo(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-violet-600 hover:bg-violet-50 transition-colors"
                          >
                            <FileText size={11} /> Facturas <ChevronRight size={10} />
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModal(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleEliminar(p)}
                            disabled={eliminando === p.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            {eliminando === p.id
                              ? <Loader2 size={13} className="animate-spin" />
                              : <Trash2 size={13} />
                            }
                          </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-[11px] text-gray-300 text-right">{filtrados.length} proveedor(es)</p>
        </div>
      </main>
    </div>
  )
}
