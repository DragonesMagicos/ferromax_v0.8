import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, Tag, Clock, Package } from 'lucide-react'
import axiosClient from '../../api/axiosClient'

const BADGES = [
  { label: 'OFERTA',        color: 'bg-red-500'     },
  { label: 'MÁS VENDIDO',   color: 'bg-blue-500'    },
  { label: 'PREMIUM',       color: 'bg-purple-500'  },
  { label: 'LIQUIDACIÓN',   color: 'bg-emerald-500' },
  { label: 'NUEVO PRECIO',  color: 'bg-sky-500'     },
  { label: 'STOCK LIMITADO',color: 'bg-red-600'     },
  { label: 'TOP VENTAS',    color: 'bg-[#FF6B35]'   },
  { label: 'OFERTA FLASH',  color: 'bg-pink-500'    },
  { label: 'IMPERDIBLE',    color: 'bg-amber-500'   },
]

const DESCUENTOS = [15, 17, 18, 20, 22, 24, 25]

const CATEGORIAS_OFERTA = ['Amoladoras', 'Taladros', 'Soldadura', 'Compresores', 'Sierras', 'Lijadoras', 'Atornilladores']

function formatPesos(n) {
  return Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function OfertaCard({ oferta, onAgregar }) {
  const [agregado, setAgregado] = useState(false)

  const handleAgregar = () => {
    if (agregado) return
    onAgregar?.(oferta.producto)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1800)
  }

  return (
    <div className="w-64 shrink-0 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 flex flex-col group hover:shadow-xl hover:border-[#FF6B35]/40 transition-all duration-300">
      <div className="relative h-48 bg-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#FF6B35]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none" />
        {oferta.producto.imagenUrl ? (
          <img
            src={oferta.producto.imagenUrl}
            alt=""
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling?.style && (e.target.nextSibling.style.display = 'flex') }}
          />
        ) : null}
        <div className={`w-full h-full ${oferta.producto.imagenUrl ? 'hidden' : 'flex'} items-center justify-center text-gray-200`}>
          <Package size={40} />
        </div>
        <span className={`absolute top-3 left-3 ${oferta.badge.color} text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider z-20`}>
          {oferta.badge.label}
        </span>
        <div className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-md flex flex-col items-center justify-center z-20">
          <span className="text-[9px] font-bold text-gray-400 leading-none">OFF</span>
          <span className="text-sm font-black text-[#FF6B35] leading-none">{oferta.descuento}%</span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-widest mb-1">{oferta.producto.nombreCategoria}</p>
        <h3 className="text-sm font-semibold text-[#1A1A2E] line-clamp-2 min-h-[2.5rem] mb-3 flex-1">{oferta.producto.nombre}</h3>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-xl font-black text-[#1A1A2E]">{formatPesos(oferta.producto.precio)}</span>
          <span className="text-xs text-gray-400 line-through mb-0.5">{formatPesos(oferta.precioAnterior)}</span>
        </div>
      </div>

      <div>
        <div className="px-4 py-1.5 text-center bg-[#FF6B35]/10">
          <span className="text-[#FF6B35] text-xs font-semibold">
            Ahorrás {formatPesos(oferta.precioAnterior - oferta.producto.precio)}
          </span>
        </div>
        <motion.button
          onClick={handleAgregar}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
          className={`w-full py-3 flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            agregado ? 'bg-emerald-500 text-white' : 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {agregado ? (
              <motion.span key="ok" className="flex items-center gap-2"
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0.4 }}>
                <Check size={14} /> Agregado
              </motion.span>
            ) : (
              <motion.span key="add" className="flex items-center gap-2"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}>
                <ShoppingCart size={14} /> Agregar al carrito
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}

export default function OfertasSemanales({ onAgregar }) {
  const [ofertas, setOfertas] = useState([])

  useEffect(() => {
    async function cargar() {
      try {
        // Cargar productos de varias categorías y tomar los primeros de cada una
        const resultados = await Promise.allSettled(
          CATEGORIAS_OFERTA.map((cat) =>
            axiosClient.get('/categorias/productos', { params: { categoria: cat, page: 0, size: 2 } })
          )
        )

        const productos = resultados
          .filter((r) => r.status === 'fulfilled')
          .flatMap((r) => r.value.data.contenido ?? [])
          .filter((p) => p.disponibilidad !== 'SIN STOCK')
          .slice(0, 10)

        const ofertasConDescuento = productos.map((producto, i) => {
          const descuento = DESCUENTOS[i % DESCUENTOS.length]
          const badge = BADGES[i % BADGES.length]
          const precioAnterior = Math.round(producto.precio / (1 - descuento / 100))
          return { producto, descuento, badge, precioAnterior }
        })

        setOfertas(ofertasConDescuento)
      } catch {
        // silencioso si falla
      }
    }
    cargar()
  }, [])

  if (ofertas.length === 0) return null

  const duplicadas = [...ofertas, ...ofertas]

  return (
    <section id="productos" className="py-20 bg-[#F8F9FA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              <Tag size={11} /> Promociones
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E]">
              Ofertas <span className="text-[#FF6B35]">Semanales</span>
            </h2>
            <p className="text-gray-400 mt-1 text-sm flex items-center gap-1.5">
              <Clock size={12} /> Precios especiales por tiempo limitado
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Actualizados hoy
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F8F9FA] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F8F9FA] to-transparent z-10 pointer-events-none" />
        <div className="flex gap-5 w-max animate-marquee-slow hover:[animation-play-state:paused]">
          {duplicadas.map((oferta, i) => (
            <OfertaCard key={i} oferta={oferta} onAgregar={onAgregar} />
          ))}
        </div>
      </div>
    </section>
  )
}
