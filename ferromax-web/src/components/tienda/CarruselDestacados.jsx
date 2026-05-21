import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Zap, Star, Award, Truck, ShieldCheck, ShoppingCart, Check } from 'lucide-react'

const OFERTAS = [
  {
    id: 7,
    nombre: 'Amoladora Angular 115mm Versa Max',
    categoria: 'Amoladoras',
    precio: 72500,
    precioAnterior: 95000,
    img: '/img/productos/AMO-115-VERSA.png',
    badge: 'OFERTA',
    badgeColor: 'bg-red-500',
    leyenda: '¡Llevá el poder profesional a tus manos!',
    descuento: 24,
    Icono: Zap,
    bg: 'from-orange-50 to-amber-50',
    acento: '#FF6B35',
  },
  {
    id: 8,
    nombre: 'Taladro Percutor 13mm 850W',
    categoria: 'Taladros',
    precio: 95800,
    precioAnterior: 119000,
    img: '/img/productos/TAL-13-PERC.png',
    badge: 'MÁS VENDIDO',
    badgeColor: 'bg-[#FF6B35]',
    leyenda: 'El favorito de los profesionales',
    descuento: 20,
    Icono: Star,
    bg: 'from-blue-50 to-indigo-50',
    acento: '#3B82F6',
  },
  {
    id: 11,
    nombre: 'Soldadora Inversora WeldPro 2500',
    categoria: 'Soldadura',
    precio: 289000,
    precioAnterior: 359000,
    img: '/img/productos/SOL-WELD-250.png',
    badge: 'PREMIUM',
    badgeColor: 'bg-purple-500',
    leyenda: 'Rendimiento industrial para tu taller',
    descuento: 19,
    Icono: Award,
    bg: 'from-purple-50 to-pink-50',
    acento: '#8B5CF6',
  },
  {
    id: 13,
    nombre: 'Motosierra 45cc 2-Stroke',
    categoria: 'Motosierras',
    precio: 225000,
    precioAnterior: 275000,
    img: '/img/productos/MOT-45CC-2T.png',
    badge: 'LIQUIDACIÓN',
    badgeColor: 'bg-emerald-500',
    leyenda: 'Potencia y corte preciso en exterior',
    descuento: 18,
    Icono: Truck,
    bg: 'from-emerald-50 to-teal-50',
    acento: '#10B981',
  },
  {
    id: 15,
    nombre: 'Martillo Demoledor SDS-MAX 1500W',
    categoria: 'Martillos y Demoledores',
    precio: 345000,
    precioAnterior: 420000,
    img: '/img/productos/MAR-SDS-1500.png',
    badge: 'STOCK LIMITADO',
    badgeColor: 'bg-red-600',
    leyenda: '45 joules de impacto imparable',
    descuento: 18,
    Icono: ShieldCheck,
    bg: 'from-red-50 to-orange-50',
    acento: '#EF4444',
  },
  {
    id: 9,
    nombre: 'Sierra Circular 7¼" 1400W',
    categoria: 'Sierras',
    precio: 118900,
    precioAnterior: 149000,
    img: '/img/productos/SIE-CIRC-180.png',
    badge: 'NUEVO PRECIO',
    badgeColor: 'bg-sky-500',
    leyenda: 'Corte limpio y preciso garantizado',
    descuento: 20,
    Icono: Tag,
    bg: 'from-sky-50 to-cyan-50',
    acento: '#0EA5E9',
  },
]

function formatPesos(n) {
  return Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function OfertaCard({ oferta, index, onAgregar }) {
  const { nombre, categoria, precio, precioAnterior, img, badge, badgeColor,
          leyenda, descuento, Icono, bg, acento } = oferta
  const [agregado, setAgregado] = useState(false)

  const handleAgregar = () => {
    if (agregado) return
    onAgregar?.({ id: oferta.id, nombre, precio, nombreCategoria: categoria, imagenUrl: img, stockActual: 99 })
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1800)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`relative bg-gradient-to-br ${bg} rounded-2xl overflow-hidden border border-white shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full`}
    >
      {/* Badge */}
      <div className="absolute top-3 left-3 z-10">
        <span className={`${badgeColor} text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider`}>
          {badge}
        </span>
      </div>

      {/* Descuento */}
      <div className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white shadow-md flex flex-col items-center justify-center">
        <span className="text-[9px] font-bold text-gray-400 leading-none">OFF</span>
        <span className="text-sm font-black leading-none" style={{ color: acento }}>{descuento}%</span>
      </div>

      {/* Imagen */}
      <div className="flex items-center justify-center h-44 px-6 pt-10 pb-2">
        <img
          src={img}
          alt={nombre}
          className="h-full w-full object-contain drop-shadow-lg transition-transform duration-500 hover:scale-105"
          onError={(e) => { e.target.style.opacity = '0.2' }}
        />
      </div>

      {/* Info */}
      <div className="px-4 pb-4 flex flex-col gap-2 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: acento }}>{categoria}</p>
        <h3 className="text-sm font-bold text-[#1A1A2E] leading-snug line-clamp-2">{nombre}</h3>

        {/* Leyenda */}
        <div className="flex items-center gap-1.5">
          <Icono size={11} style={{ color: acento }} className="shrink-0" />
          <p className="text-[11px] text-gray-500 italic leading-tight">{leyenda}</p>
        </div>

        {/* Precios */}
        <div className="flex items-end gap-2 mt-auto pt-1">
          <span className="text-xl font-black text-[#1A1A2E]">{formatPesos(precio)}</span>
          <span className="text-xs text-gray-400 line-through mb-0.5">{formatPesos(precioAnterior)}</span>
        </div>

        {/* Barra de ahorro */}
        <div className="rounded-lg px-3 py-1.5 text-center text-xs font-semibold" style={{ background: `${acento}15`, color: acento }}>
          Ahorrás {formatPesos(precioAnterior - precio)}
        </div>

        {/* Botón agregar */}
        <motion.button
          onClick={handleAgregar}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: 0.1 }}
          className={`w-full mt-2 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors ${
            agregado ? 'bg-emerald-500 text-white' : 'bg-[#1A1A2E] hover:bg-[#2a2a3e] text-white'
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {agregado ? (
              <motion.span key="ok" className="flex items-center gap-1.5"
                initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0.4 }}>
                <Check size={13} /> Agregado
              </motion.span>
            ) : (
              <motion.span key="add" className="flex items-center gap-1.5"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}>
                <ShoppingCart size={13} /> Agregar al carrito
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function SeccionOfertas({ onAgregar }) {
  const duplicadas = [...OFERTAS, ...OFERTAS]

  return (
    <section id="destacados" className="py-20 bg-[#F8F9FA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="inline-flex items-center gap-1.5 bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              <Tag size={11} /> Promociones y Ofertas
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E]">
              Productos <span className="text-[#FF6B35]">Destacados</span>
            </h2>
            <p className="text-gray-500 mt-1">Precios especiales por tiempo limitado</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Actualizados hoy
          </div>
        </div>
      </div>

      {/* Galería móvil derecha → izquierda */}
      <div className="relative">
        {/* Fade izquierda */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#F8F9FA] to-transparent z-10 pointer-events-none" />
        {/* Fade derecha */}
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#F8F9FA] to-transparent z-10 pointer-events-none" />

        <div className="flex gap-5 w-max animate-marquee hover:[animation-play-state:paused]">
          {duplicadas.map((oferta, i) => (
            <div key={i} className="w-64 shrink-0 h-[420px]">
              <OfertaCard oferta={oferta} index={0} onAgregar={onAgregar} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
