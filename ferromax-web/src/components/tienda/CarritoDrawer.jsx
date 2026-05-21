import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'

function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

export default function CarritoDrawer({ items, onCerrar, onCambiarCantidad, onEliminar, onPagar, pagando }) {
  const total = items.reduce((acc, i) => acc + i.subtotal, 0)
  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onCerrar])

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onCerrar}
      />

      <motion.div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[400px] bg-white shadow-2xl flex flex-col"
        initial={{ x: '100%', opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.8 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center">
              <ShoppingBag size={18} className="text-[#FF6B35]" />
            </div>
            <div>
              <h2 className="font-bold text-[#1A1A2E]">Mi Carrito</h2>
              <p className="text-xs text-gray-400">{totalItems} artículo{totalItems !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="w-9 h-9 rounded-full hover:bg-gray-100 active:scale-95 flex items-center justify-center transition-colors active:transition-transform"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                <ShoppingBag size={36} className="text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Tu carrito está vacío</p>
                <p className="text-sm text-gray-400 mt-1">Agregá herramientas para continuar</p>
              </div>
              <button
                onClick={onCerrar}
                className="text-sm text-[#FF6B35] hover:underline font-medium"
              >
                Ver catálogo →
              </button>
            </div>
          ) : (
          <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.producto.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.95, height: 0, marginBottom: 0 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
              className="flex gap-3 bg-gray-50 rounded-2xl p-3">
              <div className="w-16 h-16 bg-white rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                {item.producto.imagenUrl
                  ? <img src={item.producto.imagenUrl} alt={item.producto.nombre} className="w-full h-full object-contain p-1" />
                  : <ShoppingBag size={20} className="text-gray-300" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A1A2E] line-clamp-2 leading-snug">
                  {item.producto.nombre}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatPesos(item.producto.precio)} c/u</p>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 bg-white rounded-full border border-gray-200 px-1">
                    <button
                      onClick={() => onCambiarCantidad(item.producto.id, item.cantidad - 1)}
                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#FF6B35] transition-colors"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-[#1A1A2E]">{item.cantidad}</span>
                    <button
                      onClick={() => onCambiarCantidad(item.producto.id, item.cantidad + 1)}
                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-[#FF6B35] transition-colors"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#FF6B35]">{formatPesos(item.subtotal)}</span>
                    <button
                      onClick={() => onEliminar(item.producto.id)}
                      className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={13} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4 bg-white">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Subtotal ({totalItems} ítem{totalItems !== 1 ? 's' : ''})</span>
              <span className="font-medium text-[#1A1A2E]">{formatPesos(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Envío</span>
              <span className="text-emerald-500 font-medium">A confirmar</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="font-bold text-[#1A1A2E]">Total</span>
              <span className="text-2xl font-black text-[#1A1A2E]">{formatPesos(total)}</span>
            </div>

            <button
              onClick={onPagar}
              disabled={pagando}
              className="w-full py-4 bg-[#FF6B35] hover:bg-[#e55a2b] active:scale-[0.98] disabled:opacity-50 text-white font-bold rounded-2xl transition-colors active:transition-transform flex items-center justify-center gap-2 text-sm"
            >
              {pagando ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Procesando...</>
              ) : (
                <>Confirmar pedido <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}
