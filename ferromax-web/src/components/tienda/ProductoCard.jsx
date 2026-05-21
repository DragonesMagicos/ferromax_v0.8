import { useState, useRef, useCallback } from 'react'
import { ShoppingCart, Heart, Check, Star, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

const STOCK_BAJO = 5

export default function ProductoCard({ producto, onAgregar }) {
  const sinStock = producto.stockActual === 0
  const stockBajo = !sinStock && producto.stockActual != null && producto.stockActual <= STOCK_BAJO
  const [agregado, setAgregado] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [favorito, setFavorito] = useState(false)
  const cardRef = useRef(null)

  const handleAgregar = () => {
    if (sinStock || agregado) return
    onAgregar(producto)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1800)
  }

  const isHoverDevice = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

  const handleMouseMove = useCallback((e) => {
    if (!isHoverDevice) return
    const card = cardRef.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5
    card.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-4px)`
    card.style.boxShadow = `${-x * 12}px ${y * 8 + 8}px 32px rgba(255,107,53,0.18)`
  }, [isHoverDevice])

  const handleMouseLeave = useCallback(() => {
    if (!isHoverDevice) return
    const card = cardRef.current
    if (!card) return
    card.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) translateY(0px)'
    card.style.boxShadow = ''
  }, [isHoverDevice])

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm transition-shadow duration-150 hover:ring-1 hover:ring-[#FF6B35]/20"
      style={{ transformStyle: 'preserve-3d', willChange: 'transform', transition: 'transform 0.15s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.15s cubic-bezier(0.23, 1, 0.32, 1)' }}
    >
      {/* Imagen */}
      <div className="relative h-56 bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#FF6B35]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none" />
        {producto.imagenUrl && !imgError ? (
          <img
            src={producto.imagenUrl}
            alt=""
            onError={() => setImgError(true)}
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-200">
            <ShoppingCart size={40} />
            <span className="text-[10px] text-gray-300 text-center px-4 line-clamp-2">{producto.nombre}</span>
          </div>
        )}

        {/* Badge stock */}
        {sinStock ? (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
            Sin stock
          </span>
        ) : stockBajo ? (
          <span className="absolute top-3 left-3 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
            <Flame size={9} /> Últimas {producto.stockActual}
          </span>
        ) : null}

        {/* Acciones hover */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <motion.button
            onClick={(e) => { e.stopPropagation(); setFavorito((v) => !v) }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', duration: 0.25, bounce: 0.5 }}
            className="w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-orange-50 transition-colors"
          >
            <Heart
              size={15}
              className={favorito ? 'text-red-500 fill-red-500' : 'text-gray-400'}
            />
          </motion.button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{producto.nombreCategoria}</p>
        <h3 className="text-sm font-semibold text-[#1A1A2E] mb-3 line-clamp-2 min-h-[2.5rem]">
          {producto.nombre}
        </h3>

        {/* Estrellas decorativas */}
        <div className="flex items-center gap-0.5 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className={i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
          ))}
        </div>

        {/* Precio */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xl font-black text-[#1A1A2E]">{formatPesos(producto.precio)}</span>
        </div>
      </div>

      {/* Botón */}
      <motion.button
        onClick={handleAgregar}
        disabled={sinStock}
        whileTap={sinStock ? {} : { scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={`w-full py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-colors duration-150 overflow-hidden relative ${
          sinStock
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : agregado
              ? 'bg-emerald-500 text-white'
              : 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {agregado ? (
            <motion.span
              key="agregado"
              className="flex items-center gap-2"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.4 }}
            >
              <Check size={15} /> Agregado
            </motion.span>
          ) : sinStock ? (
            <motion.span key="sinstock" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Sin stock
            </motion.span>
          ) : (
            <motion.span
              key="agregar"
              className="flex items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <ShoppingCart size={15} /> Añadir al carrito
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
