import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, Tag, Clock } from 'lucide-react'

const OFERTAS = [
  {
    id: 7,
    nombre: 'Amoladora Angular 115mm Versa Max',
    categoria: 'Amoladoras',
    precio: 72500,
    precioAnterior: 95000,
    img: '/img/productos/AMO-115-VERSA.jpg',
    badge: 'OFERTA',
    badgeColor: 'bg-red-500',
    descuento: 24,
  },
  {
    id: 8,
    nombre: 'Taladro Percutor 13mm 850W',
    categoria: 'Taladros',
    precio: 95800,
    precioAnterior: 119000,
    img: '/img/productos/TAL-13-PERC.jpg',
    badge: 'MÁS VENDIDO',
    badgeColor: 'bg-blue-500',
    descuento: 20,
  },
  {
    id: 11,
    nombre: 'Soldadora Inversora WeldPro 2500',
    categoria: 'Soldadura',
    precio: 289000,
    precioAnterior: 359000,
    img: '/img/productos/SOL-WELD-250.jpg',
    badge: 'PREMIUM',
    badgeColor: 'bg-purple-500',
    descuento: 19,
  },
  {
    id: 13,
    nombre: 'Motosierra 45cc 2-Stroke',
    categoria: 'Motosierras',
    precio: 225000,
    precioAnterior: 275000,
    img: '/img/productos/MOT-45CC-2T.jpg',
    badge: 'LIQUIDACIÓN',
    badgeColor: 'bg-emerald-500',
    descuento: 18,
  },
  {
    id: 15,
    nombre: 'Martillo Demoledor SDS-MAX 1500W',
    categoria: 'Martillos',
    precio: 345000,
    precioAnterior: 420000,
    img: '/img/productos/MAR-SDS-1500.jpg',
    badge: 'STOCK LIMITADO',
    badgeColor: 'bg-red-600',
    descuento: 18,
  },
  {
    id: 9,
    nombre: 'Sierra Circular 7¼" 1400W',
    categoria: 'Sierras',
    precio: 118900,
    precioAnterior: 149000,
    img: '/img/productos/SIE-CIRC-180.jpg',
    badge: 'NUEVO PRECIO',
    badgeColor: 'bg-sky-500',
    descuento: 20,
  },
  {
    id: 3,
    nombre: 'Lijadora Orbital 300W',
    categoria: 'Lijadoras',
    precio: 48500,
    precioAnterior: 62000,
    img: '/img/productos/LIJ-ORB-125.jpg',
    badge: 'OFERTA',
    badgeColor: 'bg-red-500',
    descuento: 22,
  },
  {
    id: 5,
    nombre: 'Compresor de Aire 50L 2HP',
    categoria: 'Compresores',
    precio: 185000,
    precioAnterior: 229000,
    img: '/img/productos/COMP-50L-2HP.jpg',
    badge: 'IMPERDIBLE',
    badgeColor: 'bg-amber-500',
    descuento: 19,
  },
  {
    id: 6,
    nombre: 'Atornillador a Batería 18V',
    categoria: 'Atornilladores',
    precio: 67900,
    precioAnterior: 89000,
    img: '/img/productos/TAL-INAALAM-18V.jpg',
    badge: 'TOP VENTAS',
    badgeColor: 'bg-[#FF6B35]',
    descuento: 24,
  },
  {
    id: 14,
    nombre: 'Pistola de Calor 2000W Variable',
    categoria: 'Pistolas de Calor',
    precio: 38900,
    precioAnterior: 51000,
    img: '/img/productos/PIS-CAL-2000W.jpg',
    badge: 'OFERTA FLASH',
    badgeColor: 'bg-pink-500',
    descuento: 24,
  },
]

function formatPesos(n) {
  return Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function OfertaCard({ oferta, onAgregar }) {
  const [agregado, setAgregado] = useState(false)

  const handleAgregar = () => {
    if (agregado) return
    onAgregar?.({ id: oferta.id, nombre: oferta.nombre, precio: oferta.precio, nombreCategoria: oferta.categoria, imagenUrl: oferta.img, stockActual: 99 })
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1800)
  }

  return (
    <div className="w-64 shrink-0 bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 flex flex-col group hover:shadow-xl hover:border-[#FF6B35]/40 transition-all duration-300">
      {/* Imagen */}
      <div className="relative h-48 bg-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#FF6B35]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10 pointer-events-none" />
        <img
          src={oferta.img}
          alt=""
          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <span className={`absolute top-3 left-3 ${oferta.badgeColor} text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider z-20`}>
          {oferta.badge}
        </span>
        <div className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-md flex flex-col items-center justify-center z-20">
          <span className="text-[9px] font-bold text-gray-400 leading-none">OFF</span>
          <span className="text-sm font-black text-[#FF6B35] leading-none">{oferta.descuento}%</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-widest mb-1">{oferta.categoria}</p>
        <h3 className="text-sm font-semibold text-[#1A1A2E] line-clamp-2 min-h-[2.5rem] mb-3 flex-1">{oferta.nombre}</h3>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-xl font-black text-[#1A1A2E]">{formatPesos(oferta.precio)}</span>
          <span className="text-xs text-gray-400 line-through mb-0.5">{formatPesos(oferta.precioAnterior)}</span>
        </div>
      </div>

      {/* Footer */}
      <div>
        <div className="px-4 py-1.5 text-center bg-[#FF6B35]/10">
          <span className="text-[#FF6B35] text-xs font-semibold">
            Ahorrás {formatPesos(oferta.precioAnterior - oferta.precio)}
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

const DUPLICADAS = [...OFERTAS, ...OFERTAS]

export default function OfertasSemanales({ onAgregar }) {
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

      {/* Carrusel infinito */}
      <div className="relative">
        {/* Fades laterales */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F8F9FA] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F8F9FA] to-transparent z-10 pointer-events-none" />

        <div className="flex gap-5 w-max animate-marquee-slow hover:[animation-play-state:paused]">
          {DUPLICADAS.map((oferta, i) => (
            <OfertaCard key={i} oferta={oferta} onAgregar={onAgregar} />
          ))}
        </div>
      </div>
    </section>
  )
}
