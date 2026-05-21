import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, RefreshCw, Tag, Search, X, LayoutGrid } from 'lucide-react'
import NavbarPublico from '../components/NavbarPublico'
import catalogoService from '../services/catalogoService'

function Placeholder() {
  return (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <Package size={28} className="text-gray-300" />
    </div>
  )
}

function MosaicoPreviews({ imagenes }) {
  const slots = [0, 1, 2, 3]
  return (
    <div className="grid grid-cols-2 gap-0.5 h-44 w-full overflow-hidden">
      {slots.map((i) => (
        <div key={i} className="bg-gray-50 overflow-hidden">
          {imagenes[i] ? (
            <img
              src={imagenes[i]}
              alt=""
              className="w-full h-full object-contain p-2"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <Placeholder />
          )}
        </div>
      ))}
    </div>
  )
}

function TarjetaCategoria({ categoria, index }) {
  const navigate = useNavigate()
  const cardRef = useRef(null)
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
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={() => navigate(`/catalogo/${encodeURIComponent(categoria.nombre)}`)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer border border-gray-100 hover:ring-1 hover:ring-[#FF6B35]/20"
      style={{ transformStyle: 'preserve-3d', willChange: 'transform', transition: 'transform 0.15s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.15s cubic-bezier(0.23, 1, 0.32, 1)' }}
    >
      {/* Mosaico de imágenes */}
      <div className="relative overflow-hidden">
        <MosaicoPreviews imagenes={categoria.imagenesPreview} />
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#FF6B35]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-[#1A1A2E] text-sm leading-tight mb-1 group-hover:text-[#FF6B35] transition-colors">
          {categoria.nombre}
        </h3>
        <p className="text-xs text-gray-400">
          {categoria.totalProductos} producto{categoria.totalProductos !== 1 ? 's' : ''}
        </p>

        {/* Subcategorías preview */}
        {categoria.subcategorias.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {categoria.subcategorias.slice(0, 3).map((sub) => (
              <span key={sub}
                className="inline-flex items-center gap-1 text-[10px] bg-[#FF6B35]/10 text-gray-500 px-2 py-0.5 rounded-full">
                <Tag size={8} />
                {sub.length > 20 ? sub.slice(0, 20) + '…' : sub}
              </span>
            ))}
            {categoria.subcategorias.length > 3 && (
              <span className="text-[10px] text-gray-400 px-1">
                +{categoria.subcategorias.length - 3} más
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ErrorState({ onReintentar }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
        <Package size={28} className="text-red-300" />
      </div>
      <p className="text-gray-500 font-medium">No se pudieron cargar las categorías</p>
      <button
        onClick={onReintentar}
        className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors"
      >
        <RefreshCw size={14} /> Reintentar
      </button>
    </div>
  )
}

export default function Catalogo() {
  const [categorias,      setCategorias]      = useState([])
  const [cargando,        setCargando]        = useState(true)
  const [error,           setError]           = useState(false)
  const [busqueda,        setBusqueda]        = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')

  const cargar = () => {
    setCargando(true)
    setError(false)
    catalogoService.listarCategorias()
      .then(setCategorias)
      .catch(() => setError(true))
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="min-h-screen bg-[#F8F9FA]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavbarPublico />

      <main className="pt-[72px]">
        {/* Header */}
        <div className="relative border-b border-gray-100 overflow-hidden">
          <img src="/img/fondo1catalogo.webp" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B35] mb-2">
                Catálogo completo
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
                Todas las categorías
              </h1>
              {!cargando && !error && (
                <p className="text-white/60 text-sm">
                  {categorias.length} categorías · {categorias.reduce((a, c) => a + c.totalProductos, 0).toLocaleString('es-AR')} productos
                </p>
              )}

              {/* Buscador */}
              <div className="mt-6 max-w-xl mx-auto">
                <div className="flex items-center gap-3 bg-white border border-white/30 rounded-full px-5 py-3 shadow-lg focus-within:border-[#FF6B35] focus-within:ring-2 focus-within:ring-[#FF6B35]/30 transition-all">
                  <Search size={18} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar..."
                    className="flex-1 text-sm text-[#1A1A2E] placeholder-gray-400 bg-transparent outline-none"
                  />
                  {busqueda && (
                    <button onClick={() => setBusqueda('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Contenido */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex gap-6 items-start">

            {/* ── Sidebar categorías (desktop) ── */}
            {!cargando && !error && (
              <aside className="hidden lg:block w-56 shrink-0 sticky top-24">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <LayoutGrid size={14} className="text-[#FF6B35]" />
                    <span className="text-xs font-bold text-[#1A1A2E] uppercase tracking-wider">Categorías</span>
                  </div>

                  {/* Todos */}
                  <button
                    onClick={() => setCategoriaActiva('Todos')}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors ${
                      categoriaActiva === 'Todos' ? 'bg-[#FF6B35]/10 text-[#FF6B35]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>Todos</span>
                    {categoriaActiva === 'Todos' && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />}
                  </button>

                  <div className="mx-3 border-t border-gray-100" />

                  {/* Lista de categorías */}
                  <div className="max-h-[60vh] overflow-y-auto">
                    {categorias.map((cat) => (
                      <button
                        key={cat.nombre}
                        onClick={() => { setCategoriaActiva(cat.nombre); setBusqueda('') }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                          categoriaActiva === cat.nombre
                            ? 'text-[#FF6B35] font-semibold bg-[#FF6B35]/5'
                            : 'text-gray-500 hover:text-[#FF6B35] hover:bg-gray-50 font-medium'
                        }`}
                      >
                        <span className="text-left leading-tight">{cat.nombre}</span>
                        {categoriaActiva === cat.nombre
                          ? <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] shrink-0" />
                          : <span className="text-[10px] text-gray-300 shrink-0">{cat.totalProductos}</span>
                        }
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            )}

            {/* ── Grilla ── */}
            <div className="flex-1 min-w-0">
              {cargando ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                      <div className="h-44 bg-gray-100" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <ErrorState onReintentar={cargar} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5">
                  {categorias
                    .filter((cat) => {
                      const coincideBusqueda = cat.nombre.toLowerCase().includes(busqueda.toLowerCase())
                      const coincideCategoria = categoriaActiva === 'Todos' || cat.nombre === categoriaActiva
                      return coincideBusqueda && coincideCategoria
                    })
                    .map((cat, i) => (
                      <TarjetaCategoria key={cat.nombre} categoria={cat} index={i} />
                    ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Footer mínimo */}
      <footer className="bg-[#1A1A2E] text-gray-400 text-center text-xs py-6 mt-16">
        © 2026 Ferromax S.R.L. — Todos los derechos reservados.
      </footer>
    </div>
  )
}
