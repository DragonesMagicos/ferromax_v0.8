import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import recepcionRemitoService from '../services/recepcionRemitoService'
import toast from 'react-hot-toast'
import { ClipboardList, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

const ESTADO_CONFIG = {
  PENDIENTE:   { label: 'Pendiente',   color: 'text-amber-400',  bg: 'bg-amber-400/10',  Icono: Clock        },
  CONFIRMADO:  { label: 'Confirmado',  color: 'text-green-400',  bg: 'bg-green-400/10',  Icono: CheckCircle  },
  RECHAZADO:   { label: 'Rechazado',   color: 'text-red-400',    bg: 'bg-red-400/10',    Icono: XCircle      },
}

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.PENDIENTE
  const { Icono } = cfg
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      <Icono size={12} />
      {cfg.label}
    </span>
  )
}

function ModalConfirmar({ remito, onCerrar, onGuardado }) {
  const [notasAdmin, setNotasAdmin] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviar(aprobar) {
    setCargando(true)
    try {
      await recepcionRemitoService.confirmar(remito.id, { aprobar, notasAdmin: notasAdmin.trim() || null })
      toast.success(aprobar ? 'Remito confirmado' : 'Remito rechazado')
      onGuardado()
    } catch {
      toast.error('Error al procesar el remito')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#1E1E32] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">Revisar remito</h2>
          <p className="text-white/50 text-sm mt-0.5">
            {remito.nombreProveedor} — {remito.numeroRemito}
          </p>
        </div>

        {/* Ítems */}
        <div className="p-6 space-y-3 max-h-64 overflow-y-auto">
          {remito.items?.length > 0 ? (
            remito.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <div>
                  <p className="text-white text-sm font-medium">{item.nombreProducto}</p>
                  <p className="text-white/40 text-xs">SKU: {item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#FF6B35] font-bold text-sm">+{item.cantidad} u</p>
                  <p className="text-white/40 text-xs">{item.stockAnterior} → {item.stockNuevo}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-white/30 text-sm text-center py-4">Sin ítems registrados</p>
          )}
        </div>

        {/* Notas admin */}
        <div className="px-6 pb-4">
          <label className="text-white/50 text-xs uppercase tracking-widest block mb-2">
            Notas (opcional)
          </label>
          <textarea
            value={notasAdmin}
            onChange={e => setNotasAdmin(e.target.value)}
            rows={2}
            placeholder="Observaciones sobre la revisión..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50"
          />
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCerrar}
            disabled={cargando}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => enviar(false)}
            disabled={cargando}
            className="flex-1 py-2.5 rounded-xl bg-red-500/15 text-red-400 text-sm font-medium hover:bg-red-500/25 transition-colors flex items-center justify-center gap-2"
          >
            {cargando ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Rechazar
          </button>
          <button
            onClick={() => enviar(true)}
            disabled={cargando}
            className="flex-1 py-2.5 rounded-xl bg-green-500/15 text-green-400 text-sm font-medium hover:bg-green-500/25 transition-colors flex items-center justify-center gap-2"
          >
            {cargando ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

function FilaRemito({ remito, onRevisar }) {
  const [expandido, setExpandido] = useState(false)
  const fecha = new Date(remito.createdAt).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="bg-white/[0.03] border border-white/8 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-white font-semibold text-sm truncate">{remito.nombreProveedor}</span>
            <span className="text-white/30 text-xs font-mono">{remito.numeroRemito}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-white/40 text-xs">{fecha}</span>
            <span className="text-white/25 text-xs">·</span>
            <span className="text-white/40 text-xs">Empleado: {remito.nombreEmpleado}</span>
            {remito.items?.length > 0 && (
              <>
                <span className="text-white/25 text-xs">·</span>
                <span className="text-white/40 text-xs">{remito.items.length} producto(s)</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <EstadoBadge estado={remito.estado} />
          {remito.estado === 'PENDIENTE' && (
            <button
              onClick={() => onRevisar(remito)}
              className="px-3 py-1.5 bg-[#FF6B35]/15 text-[#FF6B35] text-xs font-medium rounded-lg hover:bg-[#FF6B35]/25 transition-colors"
            >
              Revisar
            </button>
          )}
          {remito.items?.length > 0 && (
            <button
              onClick={() => setExpandido(!expandido)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              {expandido
                ? <ChevronUp size={14} className="text-white/40" />
                : <ChevronDown size={14} className="text-white/40" />}
            </button>
          )}
        </div>
      </div>

      {expandido && remito.items?.length > 0 && (
        <div className="border-t border-white/5 px-5 py-3 space-y-2">
          {remito.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="text-white/25 font-mono text-xs w-5 text-right">{i + 1}</span>
                <div>
                  <span className="text-white/80">{item.nombreProducto}</span>
                  <span className="text-white/30 text-xs ml-2">{item.sku}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[#FF6B35] font-bold">+{item.cantidad}</span>
                <span className="text-white/25 text-xs ml-2">{item.stockAnterior} → {item.stockNuevo}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RemitosPage() {
  const { isAdmin } = useAuth()
  const [remitos, setRemitos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [soloPendientes, setSoloPendientes] = useState(true)
  const [remitoARevisar, setRemitoARevisar] = useState(null)

  async function cargar() {
    setCargando(true)
    try {
      const data = soloPendientes
        ? await recepcionRemitoService.listarPendientes()
        : await recepcionRemitoService.listarTodos()
      setRemitos(data)
    } catch {
      toast.error('Error al cargar los remitos')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [soloPendientes])

  async function abrirDetalle(remito) {
    try {
      const detalle = await recepcionRemitoService.obtenerDetalle(remito.id)
      setRemitoARevisar(detalle)
    } catch {
      toast.error('Error al cargar el detalle')
    }
  }

  const pendientesCount = remitos.filter(r => r.estado === 'PENDIENTE').length

  return (
    <div className="flex min-h-screen bg-[#12121E]">
      <Sidebar />
      <main className="flex-1 p-6 space-y-6 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B35]/15 rounded-xl flex items-center justify-center">
              <ClipboardList size={18} className="text-[#FF6B35]" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Remitos de recepción</h1>
              <p className="text-white/40 text-sm">Revisá y confirmá los ingresos de mercadería</p>
            </div>
          </div>
          {pendientesCount > 0 && (
            <span className="px-3 py-1 bg-amber-400/15 text-amber-400 text-sm font-bold rounded-full">
              {pendientesCount} pendiente{pendientesCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Filtro */}
        <div className="flex gap-2">
          <button
            onClick={() => setSoloPendientes(true)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              soloPendientes
                ? 'bg-[#FF6B35] text-white'
                : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setSoloPendientes(false)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              !soloPendientes
                ? 'bg-[#FF6B35] text-white'
                : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
            }`}
          >
            Todos
          </button>
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#FF6B35]" />
          </div>
        ) : remitos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ClipboardList size={40} className="text-white/10" />
            <p className="text-white/30 text-sm">
              {soloPendientes ? 'No hay remitos pendientes' : 'No hay remitos registrados'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {remitos.map(remito => (
              <FilaRemito
                key={remito.id}
                remito={remito}
                onRevisar={abrirDetalle}
              />
            ))}
          </div>
        )}
      </main>

      {remitoARevisar && (
        <ModalConfirmar
          remito={remitoARevisar}
          onCerrar={() => setRemitoARevisar(null)}
          onGuardado={() => { setRemitoARevisar(null); cargar() }}
        />
      )}
    </div>
  )
}