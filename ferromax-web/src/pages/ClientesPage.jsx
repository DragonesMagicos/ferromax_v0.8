import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import toast from 'react-hot-toast'
import {
  Users, Plus, Pencil, Trash2, X, Check, Loader2,
  Phone, Mail, ShieldCheck, CreditCard,
} from 'lucide-react'
import api from '../services/api'

const CONDICIONES_IVA = [
  'Responsable Inscripto',
  'Monotributo',
  'Exento',
  'Consumidor Final',
]

const VACIO = { nombre: '', apellido: '', email: '', cuit: '', telefono: '', condicionIva: '' }

function ModalCliente({ cliente, onGuardar, onCerrar }) {
  const [form, setForm] = useState(cliente ? {
    nombre:       cliente.nombre       ?? '',
    apellido:     cliente.apellido     ?? '',
    email:        cliente.email        ?? '',
    cuit:         cliente.cuit         ?? '',
    telefono:     cliente.telefono     ?? '',
    condicionIva: cliente.condicionIva ?? '',
  } : { ...VACIO })
  const [guardando, setGuardando] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleGuardar = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setGuardando(true)
    try {
      if (cliente) {
        const { data } = await api.put(`/clientes/${cliente.id}`, form)
        onGuardar(data)
      } else {
        const { data } = await api.post('/clientes', form)
        onGuardar(data)
      }
    } catch (err) {
      const msg = err?.response?.data?.message
      toast.error(msg ?? 'Error al guardar el cliente')
    } finally {
      setGuardando(false)
    }
  }

  const inp = 'w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400'

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
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={14} className="text-blue-600" />
            </div>
            <h2 className="font-bold text-gray-800 text-sm">
              {cliente ? 'Editar cliente' : 'Nuevo cliente'}
            </h2>
          </div>
          <button onClick={onCerrar} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nombre *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                className={inp} placeholder="Ej: Juan" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Apellido</label>
              <input value={form.apellido} onChange={e => set('apellido', e.target.value)}
                className={inp} placeholder="Ej: García" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">CUIT</label>
              <input value={form.cuit} onChange={e => set('cuit', e.target.value)}
                className={inp + ' font-mono'} placeholder="xx-xxxxxxxx-x" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)}
                className={inp} placeholder="Ej: 011-4444-5555" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className={inp} placeholder="cliente@email.com" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Condición IVA</label>
              <select value={form.condicionIva} onChange={e => set('condicionIva', e.target.value)}
                className={inp}>
                <option value="">— Sin especificar —</option>
                {CONDICIONES_IVA.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCerrar}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-bold hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-[2] py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {guardando ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {cliente ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function ClientesPage() {
  const [clientes, setClientes]     = useState([])
  const [cargando, setCargando]     = useState(true)
  const [modal, setModal]           = useState(null)   // null | 'nuevo' | cliente
  const [buscando, setBuscando]     = useState('')
  const [eliminando, setEliminando] = useState(null)

  const cargar = useCallback(() => {
    setCargando(true)
    api.get('/clientes')
      .then(r => setClientes(r.data))
      .catch(() => toast.error('Error al cargar clientes'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handleGuardar = (cli) => {
    setClientes(prev => {
      const idx = prev.findIndex(c => c.id === cli.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = cli; return next }
      return [...prev, cli].sort((a, b) => a.nombre.localeCompare(b.nombre))
    })
    toast.success(modal === 'nuevo' ? 'Cliente creado' : 'Cliente actualizado')
    setModal(null)
  }

  const handleEliminar = async (cli) => {
    if (!window.confirm(`¿Eliminar a ${cli.nombre} ${cli.apellido ?? ''}?`)) return
    setEliminando(cli.id)
    try {
      await api.delete(`/clientes/${cli.id}`)
      setClientes(prev => prev.filter(c => c.id !== cli.id))
      toast.success('Cliente eliminado')
    } catch {
      toast.error('No se pudo eliminar el cliente')
    } finally {
      setEliminando(null)
    }
  }

  const filtrados = clientes.filter(c =>
    `${c.nombre} ${c.apellido ?? ''}`.toLowerCase().includes(buscando.toLowerCase()) ||
    c.email?.toLowerCase().includes(buscando.toLowerCase()) ||
    c.cuit?.includes(buscando)
  )

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <AnimatePresence>
        {modal && (
          <ModalCliente
            cliente={modal === 'nuevo' ? null : modal}
            onGuardar={handleGuardar}
            onCerrar={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-auto">
        <header className="bg-white border-b border-gray-100 px-8 h-[72px] flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1A1A2E]">Clientes</h1>
            <p className="text-xs text-gray-400">Gestión de clientes</p>
          </div>
          <button
            onClick={() => setModal('nuevo')}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={13} /> Nuevo cliente
          </button>
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full space-y-4">

          {/* Buscador */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <Users size={15} className="text-gray-300 shrink-0" />
            <input
              value={buscando}
              onChange={e => setBuscando(e.target.value)}
              placeholder="Buscar por nombre, email o CUIT…"
              className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-300"
            />
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {cargando ? (
              <div className="flex justify-center py-16">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            ) : filtrados.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-gray-300">
                <Users size={32} />
                <p className="text-sm">
                  {buscando ? 'Sin resultados para esa búsqueda' : 'No hay clientes registrados'}
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cliente</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">CUIT</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contacto</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Condición IVA</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Monto compras</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtrados.map(c => (
                    <tr key={c.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                            <Users size={13} className="text-blue-600" />
                          </div>
                          <span className="font-semibold text-gray-800 text-sm">
                            {c.nombre} {c.apellido ?? ''}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {c.cuit
                          ? <span className="font-mono text-xs text-gray-500 flex items-center gap-1"><ShieldCheck size={11} className="text-emerald-500" />{c.cuit}</span>
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          {c.telefono && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10} className="text-gray-300" />{c.telefono}</span>}
                          {c.email    && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} className="text-gray-300" />{c.email}</span>}
                          {!c.telefono && !c.email && <span className="text-gray-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">
                        {c.condicionIva ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {parseFloat(c.totalCompras ?? 0) > 0
                          ? <span className="text-xs font-semibold flex items-center gap-1 text-emerald-600">
                              <CreditCard size={11} />
                              {parseFloat(c.totalCompras).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}
                            </span>
                          : <span className="text-gray-300 text-xs">Sin compras</span>
                        }
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModal(c)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleEliminar(c)}
                            disabled={eliminando === c.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                          >
                            {eliminando === c.id
                              ? <Loader2 size={13} className="animate-spin" />
                              : <Trash2 size={13} />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <p className="text-[11px] text-gray-300 text-right">{filtrados.length} cliente(s)</p>
        </div>
      </main>
    </div>
  )
}
