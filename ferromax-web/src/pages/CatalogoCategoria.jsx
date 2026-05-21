import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, RefreshCw, ChevronLeft, ChevronRight, Filter, X, ShoppingCart } from 'lucide-react'
import NavbarPublico from '../components/NavbarPublico'
import catalogoService from '../services/catalogoService'

const DISP_CONFIG = {
  'STOCK ALTO':  { label: 'Stock alto',  bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'STOCK MEDIO': { label: 'Stock medio', bg: 'bg-yellow-100',  text: 'text-yellow-700',  dot: 'bg-yellow-400' },
  'STOCK BAJO':  { label: 'Stock bajo',  bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-400' },
  'SIN STOCK':   { label: 'Sin stock',   bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-400'    },
}

function BadgeDisp({ disponibilidad }) {
  const cfg = DISP_CONFIG[disponibilidad] ?? DISP_CONFIG['SIN STOCK']
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function TarjetaProducto({ producto }) {
  const sinStock = producto.disponibilidad === 'SIN STOCK'
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
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:ring-1 hover:ring-[#FF6B35]/20 flex flex-col"
      style={{ transformStyle: 'preserve-3d', willChange: 'transform', transition: 'transform 0.15s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.15s cubic-bezier(0.23, 1, 0.32, 1)' }}
    >
      {/* Imagen */}
      <div className="relative h-48 bg-gray-50 overflow-hidden">
        {producto.imagenUrl ? (
          <img
            src={producto.imagenUrl}
            alt={producto.nombre}
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <div className={`w-full h-full ${producto.imagenUrl ? 'hidden' : 'flex'} items-center justify-center text-gray-200`}>
          <ShoppingCart size={40} />
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3">
          <BadgeDisp disponibilidad={producto.disponibilidad} />
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {producto.marca && (
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            {producto.marca}
          </p>
        )}
        <h3 className="text-sm font-semibold text-[#1A1A2E] line-clamp-2 min-h-[2.5rem] mb-3 flex-1">
          {producto.nombre}
        </h3>
        {producto.subcategoria && (
          <p className="text-[10px] text-gray-400 mb-2 truncate">{producto.subcategoria}</p>
        )}
        <p className="text-xl font-black text-[#1A1A2E]">{formatPesos(producto.precio)}</p>
      </div>

      {/* Botón */}
      <button
        disabled={sinStock}
        className={`w-full py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
          sinStock
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-[#FF6B35] hover:bg-[#e55a2b] text-white'
        }`}
      >
        <ShoppingCart size={14} />
        {sinStock ? 'Sin stock' : 'Agregar al carrito'}
      </button>
    </motion.div>
  )
}

function PanelFiltros({ subcategorias, subcatActiva, onSubcat, onLimpiar, totalFiltros }) {
  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-[#1A1A2E] flex items-center gap-2">
          <Filter size={14} /> Filtros
          {totalFiltros > 0 && (
            <span className="w-5 h-5 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalFiltros}
            </span>
          )}
        </h3>
        {totalFiltros > 0 && (
          <button onClick={onLimpiar} className="text-xs text-gray-400 hover:text-[#FF6B35] flex items-center gap-1">
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* Subcategorías */}
      {subcategorias.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Subcategoría</p>
          <div className="space-y-2">
            {subcategorias.map((sub) => (
              <label key={sub} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={subcatActiva === sub}
                  onChange={() => onSubcat(subcatActiva === sub ? null : sub)}
                  className="w-4 h-4 rounded accent-[#FF6B35] cursor-pointer"
                />
                <span className="text-sm text-gray-600 group-hover:text-[#FF6B35] transition-colors leading-tight">
                  {sub}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

    </aside>
  )
}

function Paginacion({ paginaActual, totalPaginas, onChange }) {
  if (totalPaginas <= 1) return null
  const pages = []
  const start = Math.max(0, paginaActual - 2)
  const end   = Math.min(totalPaginas - 1, paginaActual + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        onClick={() => onChange(paginaActual - 1)}
        disabled={paginaActual === 0}
        className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"
      >
        <ChevronLeft size={18} />
      </button>
      {start > 0 && <span className="text-gray-400 px-1">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 rounded-full text-sm font-semibold transition-colors ${
            p === paginaActual
              ? 'bg-[#FF6B35] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {p + 1}
        </button>
      ))}
      {end < totalPaginas - 1 && <span className="text-gray-400 px-1">…</span>}
      <button
        onClick={() => onChange(paginaActual + 1)}
        disabled={paginaActual >= totalPaginas - 1}
        className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

function ErrorState({ onReintentar }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
        <Package size={28} className="text-red-300" />
      </div>
      <p className="text-gray-500 font-medium">No se pudieron cargar los productos</p>
      <button onClick={onReintentar}
        className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors">
        <RefreshCw size={14} /> Reintentar
      </button>
    </div>
  )
}

export default function CatalogoCategoria() {
  const { categoria } = useParams()
  const nombreCategoria = decodeURIComponent(categoria ?? '')
  const navigate = useNavigate()

  const [pagina, setPagina]           = useState({ contenido: [], paginaActual: 0, totalPaginas: 0, totalElementos: 0 })
  const [subcats, setSubcats]         = useState([])
  const [subcatActiva, setSubcatActiva] = useState(null)

  const [paginaActual, setPaginaActual] = useState(0)
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState(false)
  const [filtrosMovil, setFiltrosMovil] = useState(false)

  // Cargar subcategorías de la categoría desde el endpoint de categorías
  useEffect(() => {
    catalogoService.listarCategorias()
      .then((cats) => {
        const cat = cats.find((c) => c.nombre === nombreCategoria)
        if (cat) setSubcats(cat.subcategorias)
      })
      .catch(() => {})
  }, [nombreCategoria])

  const cargarProductos = useCallback(() => {
    setCargando(true)
    setError(false)
    catalogoService.listarProductos({
      categoria: nombreCategoria,
      subcategoria: subcatActiva,
      page: paginaActual,
    })
      .then(setPagina)
      .catch(() => setError(true))
      .finally(() => setCargando(false))
  }, [nombreCategoria, subcatActiva, paginaActual])

  useEffect(() => { cargarProductos() }, [cargarProductos])

  // Al cambiar filtros, volver a página 0
  const cambiarSubcat = (sub) => { setSubcatActiva(sub); setPaginaActual(0) }
  const limpiarFiltros = () => { setSubcatActiva(null); setPaginaActual(0) }

  const productosFiltrados = pagina.contenido.filter((p) => p.disponibilidad !== 'SIN STOCK')

  const totalFiltros = subcatActiva ? 1 : 0

  return (
    <div className="min-h-screen bg-[#F8F9FA]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <NavbarPublico />

      <main className="pt-[72px]">
        {/* Breadcrumb + Header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <nav className="flex items-center gap-2 text-xs text-gray-400 mb-4">
              <button onClick={() => navigate('/catalogo')} className="hover:text-[#FF6B35] transition-colors">
                Catálogo
              </button>
              <ChevronRight size={12} />
              <span className="text-[#1A1A2E] font-medium">{nombreCategoria}</span>
            </nav>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A2E]">{nombreCategoria}</h1>
                {!cargando && !error && (
                  <p className="text-gray-400 text-sm mt-1">
                    {pagina.totalElementos.toLocaleString('es-AR')} producto{pagina.totalElementos !== 1 ? 's' : ''}
                    {subcatActiva && ` · ${subcatActiva}`}
                  </p>
                )}
              </div>
              {/* Botón filtros móvil */}
              <button
                onClick={() => setFiltrosMovil(true)}
                className="lg:hidden flex items-center gap-2 bg-white border border-gray-200 text-sm font-medium px-4 py-2.5 rounded-full shadow-sm"
              >
                <Filter size={14} /> Filtros
                {totalFiltros > 0 && (
                  <span className="w-5 h-5 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalFiltros}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar filtros desktop */}
            <div className="hidden lg:block w-56 shrink-0">
              <div className="bg-white rounded-2xl p-5 shadow-sm sticky top-24">
                <PanelFiltros
                  subcategorias={subcats}
                  subcatActiva={subcatActiva}
                  onSubcat={cambiarSubcat}
                  onLimpiar={limpiarFiltros}
                  totalFiltros={totalFiltros}
                />
              </div>
            </div>

            {/* Grilla productos */}
            <div className="flex-1 min-w-0">
              {cargando ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                      <div className="h-48 bg-gray-100" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                        <div className="h-4 bg-gray-100 rounded w-full" />
                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                        <div className="h-6 bg-gray-100 rounded w-1/2 mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <ErrorState onReintentar={cargarProductos} />
              ) : productosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Package size={28} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">Sin productos con estos filtros</p>
                  <button onClick={limpiarFiltros}
                    className="text-sm text-[#FF6B35] hover:underline font-medium">
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <>
                  <motion.div
                    layout
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                  >
                    {productosFiltrados.map((p) => (
                      <TarjetaProducto key={p.id} producto={p} />
                    ))}
                  </motion.div>
                  <Paginacion
                    paginaActual={paginaActual}
                    totalPaginas={pagina.totalPaginas}
                    onChange={(p) => { setPaginaActual(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Drawer filtros móvil */}
      <AnimatePresence>
        {filtrosMovil && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFiltrosMovil(false)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-[#1A1A2E]">Filtros</h2>
                <button onClick={() => setFiltrosMovil(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>
              <PanelFiltros
                subcategorias={subcats}
                subcatActiva={subcatActiva}
                onSubcat={(s) => { cambiarSubcat(s); setFiltrosMovil(false) }}
                onLimpiar={() => { limpiarFiltros(); setFiltrosMovil(false) }}
                totalFiltros={totalFiltros}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="bg-[#1A1A2E] text-gray-400 text-center text-xs py-6 mt-16">
        © 2026 Ferromax S.R.L. — Todos los derechos reservados.
      </footer>
    </div>
  )
}
