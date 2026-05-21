import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShoppingCart, Check, PackageCheck } from 'lucide-react'
import dashboardService from '../../services/dashboardService'
import toast from 'react-hot-toast'

export default function AlertaStockPanel({ alertas: inicial = [] }) {
  const [alertas, setAlertas] = useState(inicial)

  const marcarLeida = async (id) => {
    try {
      await dashboardService.marcarAlertaLeida(id)
      setAlertas((prev) => prev.filter((a) => a.id !== id))
      toast.success('Alerta marcada como leída', {
        style: { borderRadius: '12px', background: '#1A1A2E', color: '#fff' },
        iconTheme: { primary: '#10B981', secondary: '#fff' },
      })
    } catch {
      toast.error('No se pudo marcar la alerta')
    }
  }

  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <PackageCheck size={22} className="text-emerald-500" />
        </div>
        <p className="text-sm font-medium text-gray-400">Todo el stock en orden</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2.5">
      <AnimatePresence initial={false}>
        {alertas.map((a) => {
          const sinStock = a.stockActual === 0
          return (
            <motion.li
              key={a.id}
              layout
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
              className={`rounded-xl border p-3.5 flex items-center justify-between gap-2 ${
                sinStock
                  ? 'bg-red-50 border-red-100'
                  : 'bg-amber-50 border-amber-100'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  sinStock ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  <AlertTriangle size={13} className={sinStock ? 'text-red-500' : 'text-amber-500'} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A2E] truncate">{a.nombreProducto}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <span className={`font-bold ${sinStock ? 'text-red-500' : 'text-amber-500'}`}>
                      {a.stockActual} en stock
                    </span>
                    <span className="text-gray-300">·</span>
                    mín. {a.stockMinimo}
                  </p>
                </div>
              </div>

              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => toast('Funcionalidad de OC próximamente', { icon: '🛒' })}
                  className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:border-[#FF6B35]/40 hover:bg-[#FF6B35]/5 flex items-center justify-center transition-colors"
                  title="Crear orden de compra"
                >
                  <ShoppingCart size={12} className="text-gray-400" />
                </button>
                <button
                  onClick={() => marcarLeida(a.id)}
                  className="w-7 h-7 rounded-lg bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 flex items-center justify-center transition-colors"
                  title="Marcar como leída"
                >
                  <Check size={12} className="text-gray-400" />
                </button>
              </div>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}
