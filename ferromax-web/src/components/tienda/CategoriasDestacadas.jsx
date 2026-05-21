import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Wrench, Droplets, Zap, Hammer, Leaf, Shield } from 'lucide-react'

const CATEGORIAS = [
  {
    titulo: 'Herramientas Eléctricas',
    subtitulo: 'Potencia sin límites para profesionales.',
    slug: 'Amoladoras',
    tipo: 'foto',
    bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    foto: '/img/Herramientas_electricas.jpg',
    cta: 'EXPLORAR',
    size: 'grande',
  },
  {
    titulo: 'Herramientas Manuales',
    subtitulo: 'Más de 200 productos',
    slug: 'Herramientas Manuales',
    tipo: 'foto',
    foto: '/img/herramientas-manuales.jpg',
    size: 'mediana',
  },
  {
    titulo: 'Plomería',
    slug: 'Sanitarios y Plomería',
    tipo: 'foto',
    foto: '/img/plemeria.jpg',
    size: 'chica',
  },
  {
    titulo: 'Construcción',
    slug: 'Construcción y Pintura',
    tipo: 'foto',
    foto: '/img/pinceles.jpg',
    size: 'chica',
  },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay, ease: [0.23, 1, 0.32, 1] },
})

export default function CategoriasDestacadas() {
  const [grande, mediana, chica1, chica2] = CATEGORIAS

  return (
    <section id="destacados" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <motion.div {...fadeUp()} className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E]">
              Categorías <span className="text-[#FF6B35]">Destacadas</span>
            </h2>
            <p className="text-gray-400 mt-1 text-sm">Explore nuestra selección técnica especializada.</p>
          </div>
          <Link
            to="/catalogo"
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-[#FF6B35] hover:underline uppercase tracking-wider"
          >
            Ver todo <ArrowRight size={14} />
          </Link>
        </motion.div>

        {/* Grid móvil: apilado. Desktop: 2 columnas con grande a la izquierda */}
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:grid-rows-2 sm:h-[520px]">

          {/* Tarjeta GRANDE — full width en móvil, 2 filas en desktop */}
          <motion.div {...fadeUp(0.05)} className="relative rounded-2xl overflow-hidden group cursor-pointer h-52 sm:h-auto sm:row-span-2">
            <Link to={`/catalogo/${encodeURIComponent(grande.slug)}`} className="block w-full h-full">
              <img
                src={grande.foto}
                alt={grande.titulo}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
                  {grande.subtitulo}
                </p>
                <h3 className="text-white text-xl sm:text-2xl font-black leading-tight mb-3 sm:mb-4">
                  {grande.titulo}
                </h3>
                <span className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-xs font-bold uppercase tracking-widest px-4 py-2 sm:px-5 sm:py-2.5 rounded-full transition-colors">
                  {grande.cta} <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          </motion.div>

          {/* Tarjeta MEDIANA */}
          <motion.div {...fadeUp(0.1)} className="relative rounded-2xl overflow-hidden group cursor-pointer h-40 sm:h-auto">
            <Link to={`/catalogo/${encodeURIComponent(mediana.slug)}`} className="block w-full h-full">
              <img
                src={mediana.foto}
                alt={mediana.titulo}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <h3 className="text-white text-base sm:text-lg font-black">{mediana.titulo}</h3>
                <p className="text-[#FF6B35] text-xs font-bold uppercase tracking-wider mt-0.5">
                  {mediana.subtitulo}
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Dos tarjetas chicas — siempre en grid 2 columnas */}
          <div className="grid grid-cols-2 gap-4 h-32 sm:h-auto">
            {[chica1, chica2].map((cat, i) => (
              <motion.div key={cat.titulo} {...fadeUp(0.15 + i * 0.05)} className="relative rounded-2xl overflow-hidden group cursor-pointer">
                <Link to={`/catalogo/${encodeURIComponent(cat.slug)}`} className="block w-full h-full">
                  <img
                    src={cat.foto}
                    alt={cat.titulo}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-center">
                    <span className="text-white text-xs font-black uppercase tracking-widest text-center">
                      {cat.titulo}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>

        {/* Ver todo — mobile */}
        <div className="sm:hidden flex justify-center mt-6">
          <Link
            to="/catalogo"
            className="flex items-center gap-1.5 text-sm font-bold text-[#FF6B35] uppercase tracking-wider"
          >
            Ver todo <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  )
}
