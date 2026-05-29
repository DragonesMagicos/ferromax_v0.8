import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import KPICard from '../components/dashboard/KPICard'
import VentasBarChart from '../components/dashboard/VentasBarChart'
import AlertaStockPanel from '../components/dashboard/AlertaStockPanel'
import dashboardService from '../services/dashboardService'
import {
  RefreshCw, TrendingUp, AlertTriangle, Package,
  Wallet, BarChart2, Clock,
} from 'lucide-react'

const ESTADO_BADGE = {
  COMPLETADA: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  PENDIENTE:  'bg-amber-50  text-amber-600  border border-amber-100',
  ANULADA:    'bg-red-50    text-red-600    border border-red-100',
}

function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="skeleton w-11 h-11 rounded-xl" />
        <div className="skeleton h-5 w-28 rounded-full" />
      </div>
      <div className="skeleton h-8 w-32 rounded-lg" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  )
}

function SkeletonBlock({ h = 'h-48' }) {
  return <div className={`skeleton ${h} rounded-2xl`} />
}

function SectionCard({ title, badge, icon: Icon, children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center">
              <Icon size={15} className="text-[#FF6B35]" />
            </div>
          )}
          <h2 className="text-sm font-bold text-[#1A1A2E]">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </motion.div>
  )
}

export default function DashboardPage() {
  const { usuario } = useAuth()
  const location = useLocation()
  const [resumen, setResumen]           = useState(null)
  const [ventasSemana, setVentasSemana] = useState([])
  const [transacciones, setTransacciones] = useState([])
  const [alertas, setAlertas]           = useState([])
  const [cargando, setCargando]         = useState(true)
  const [error, setError]               = useState(null)
  const [girando, setGirando]           = useState(false)

  const cargarDatos = useCallback(() => {
    setCargando(true)
    setGirando(true)
    setError(null)
    Promise.all([
      dashboardService.resumen(),
      dashboardService.ventasSemana(),
      dashboardService.transacciones(),
      dashboardService.alertas(),
    ])
      .then(([r, vs, tr, al]) => {
        setResumen(r)
        setVentasSemana(vs)
        setTransacciones(tr)
        setAlertas(al)
      })
      .catch((err) => {
        setError(`Error ${err?.response?.status ?? ''}: ${err?.response?.data?.message ?? err?.message ?? 'No se pudieron cargar los datos.'}`)
      })
      .finally(() => {
        setCargando(false)
        setTimeout(() => setGirando(false), 600)
      })
  }, [])

  useEffect(() => { cargarDatos() }, [location.key, cargarDatos])

  const saludo = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  const fecha = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-auto">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-0 flex items-center justify-between sticky top-0 z-10 shadow-sm h-[72px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center">
              <BarChart2 size={18} className="text-[#FF6B35]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#1A1A2E]">
                {saludo()}, <span className="text-[#FF6B35]">{usuario?.nombre}</span>
              </h1>
              <p className="text-xs text-gray-400 capitalize">{fecha}</p>
            </div>
          </div>

          <button
            onClick={cargarDatos}
            disabled={cargando}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#FF6B35] transition-colors disabled:opacity-40 border border-gray-200 hover:border-[#FF6B35]/40 px-4 py-2 rounded-full bg-white active:scale-95"
          >
            <RefreshCw size={13} className={girando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </header>

        <div className="p-8 space-y-5 max-w-7xl w-full mx-auto">

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-red-600 text-sm flex items-center gap-2.5">
              <AlertTriangle size={16} className="shrink-0" /> {error}
            </div>
          )}

          {/* KPI Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cargando ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : (
              <>
                <KPICard
                  titulo="Ventas del día"
                  valor={formatPesos(resumen?.ventasHoy)}
                  subtitulo={`${resumen?.cantidadVentasHoy ?? 0} operaciones`}
                  color="verde"
                  Icono={TrendingUp}
                  staggerIndex={0}
                />
                <KPICard
                  titulo="Stock crítico"
                  valor={resumen?.productosStockCritico ?? 0}
                  subtitulo="productos bajo mínimo"
                  color="rojo"
                  Icono={AlertTriangle}
                  staggerIndex={1}
                />
                <KPICard
                  titulo="Pedidos online"
                  valor={resumen?.pedidosPendientes ?? 0}
                  subtitulo="pendientes / confirmados"
                  color="azul"
                  Icono={Package}
                  staggerIndex={2}
                />
                <KPICard
                  titulo="Caja efectivo"
                  valor={formatPesos(resumen?.saldoCaja)}
                  subtitulo="ventas en efectivo hoy"
                  color="naranja"
                  Icono={Wallet}
                  staggerIndex={3}
                />
              </>
            )}
          </section>

          {/* Gráfico + Alertas */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <SectionCard
              title="Ventas últimos 7 días"
              icon={BarChart2}
              badge={
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                  ARS
                </span>
              }
              className="lg:col-span-2"
            >
              {cargando ? <SkeletonBlock h="h-52" /> : <VentasBarChart datos={ventasSemana} />}
            </SectionCard>

            <SectionCard
              title="Alertas de stock"
              icon={AlertTriangle}
              badge={
                alertas.length > 0 && (
                  <span className="bg-red-50 text-red-500 border border-red-100 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {alertas.length}
                  </span>
                )
              }
            >
              {cargando ? <SkeletonBlock h="h-52" /> : <AlertaStockPanel alertas={alertas} />}
            </SectionCard>
          </section>

          {/* Últimas transacciones */}
          <SectionCard title="Últimas transacciones" icon={Clock}>
            {cargando ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="skeleton h-4 w-12 rounded" />
                    <div className="skeleton h-4 w-28 rounded" />
                    <div className="skeleton h-4 w-20 rounded" />
                    <div className="skeleton h-4 w-20 ml-auto rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Hora</th>
                      <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cajero</th>
                      <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Medio de pago</th>
                      <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">Monto</th>
                      <th className="pb-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transacciones.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-300 text-sm">
                          Sin transacciones registradas hoy
                        </td>
                      </tr>
                    ) : transacciones.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 text-gray-400 text-xs font-mono">
                          {new Date(t.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 text-[#1A1A2E] font-semibold text-sm">{t.nombreCajero}</td>
                        <td className="py-3 text-gray-400 text-sm">{t.medioPago}</td>
                        <td className="py-3 text-right font-black text-[#1A1A2E]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                          {formatPesos(t.total)}
                        </td>
                        <td className="py-3">
                          <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${ESTADO_BADGE[t.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                            {t.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

        </div>
      </main>
    </div>
  )
}
