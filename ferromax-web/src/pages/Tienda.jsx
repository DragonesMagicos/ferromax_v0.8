import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import ProductoCard from '../components/tienda/ProductoCard'
import CarritoDrawer from '../components/tienda/CarritoDrawer'
import CategoriasDestacadas from '../components/tienda/CategoriasDestacadas'
import OfertasSemanales from '../components/tienda/OfertasSemanales'
import Testimonios from '../components/tienda/Testimonios'
import productoService from '../services/productoService'
import pedidoService from '../services/pedidoService'
import toast from 'react-hot-toast'
import {
  ShoppingCart, Search, Menu, X, ArrowRight, Zap,
  Package, Truck, Shield, Star, Phone, Mail, Clock,
  LogOut, ClipboardList, ChevronDown, ChevronRight, LayoutGrid,
  Wrench, Zap as ZapIcon, Hammer, Droplets, Leaf, Home, Settings
} from 'lucide-react'

const GRUPOS_CATEGORIAS = [
  {
    grupo: 'Herramientas Eléctricas',
    icono: ZapIcon,
    cats: ['Amoladoras', 'Taladros', 'Sierras', 'Caladores', 'Lijadoras', 'Atornilladores', 'Cortaceramicas', 'Pistolas de Calor', 'Aspiradoras'],
  },
  {
    grupo: 'Herramientas Manuales',
    icono: Wrench,
    cats: ['Herramientas Manuales', 'Martillos y Demoledores', 'Fijaciones'],
  },
  {
    grupo: 'Potencia y Fuerza',
    icono: Settings,
    cats: ['Soldadura', 'Compresores', 'Motosierras', 'Neumática'],
  },
  {
    grupo: 'Construcción',
    icono: Hammer,
    cats: ['Construcción y Pintura', 'Electricidad', 'Consumibles y Accesorios', 'Organización y Almacenaje'],
  },
  {
    grupo: 'Plomería y Agua',
    icono: Droplets,
    cats: ['Sanitarios y Plomería', 'Caños y Tubería PVC', 'Piletas y Agua'],
  },
  {
    grupo: 'Jardín y Exterior',
    icono: Leaf,
    cats: ['Jardín', 'Jardín y Exterior', 'Limpieza Industrial'],
  },
  {
    grupo: 'Seguridad y Hogar',
    icono: Home,
    cats: ['Seguridad y EPP', 'Hogar y Varios'],
  },
]

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

const NAV_LINKS = [
  { label: 'Nosotros', href: '#nosotros' },
]
const CATALOGO_LINK = { label: 'Catálogo', to: '/catalogo' }

export default function TiendaPage() {
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const productosRef = useRef(null)

  const [productos, setProductos]         = useState([])
  const [cargando, setCargando]           = useState(true)
  const [busqueda, setBusqueda]           = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('Todos')
  const [carrito, setCarrito]             = useState([])
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [pagando, setPagando]             = useState(false)
  const [scrolled, setScrolled]           = useState(false)
  const [menuMovil, setMenuMovil]         = useState(false)
  const [busquedaAbierta, setBusquedaAbierta] = useState(false)
  const [porPagina, setPorPagina]   = useState(12)
  const [pagina, setPagina]         = useState(1)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [grupoAbierto, setGrupoAbierto] = useState(null)
  const dropdownRef = useRef(null)
  const closeTimerRef = useRef(null)
  const heroRef = useRef(null)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 180])
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])

  const abrirDropdown = () => {
    clearTimeout(closeTimerRef.current)
    setDropdownAbierto(true)
  }
  const cerrarDropdown = () => {
    closeTimerRef.current = setTimeout(() => {
      setDropdownAbierto(false)
      setGrupoAbierto(null)
    }, 120)
  }

  useEffect(() => {
    return () => clearTimeout(closeTimerRef.current)
  }, [])

  useEffect(() => {
    productoService.listarPublico()
      .then(setProductos)
      .catch(() => toast.error('No se pudieron cargar los productos'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const categorias = useMemo(() => {
    const set = new Set(productos.map((p) => p.nombreCategoria).filter(Boolean))
    return ['Todos', ...Array.from(set).sort()]
  }, [productos])

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      if (categoriaActiva !== 'Todos' && p.nombreCategoria !== categoriaActiva) return false
      if (!busqueda) return true
      return p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    })
  }, [productos, categoriaActiva, busqueda])

  useEffect(() => { setPagina(1) }, [categoriaActiva, busqueda, porPagina])

  const totalPaginas   = Math.ceil(productosFiltrados.length / porPagina)
  const productosPagina = productosFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina)

  const agregarAlCarrito = useCallback((producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id)
      if (existe) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * Number(i.producto.precio) }
            : i
        )
      }
      return [...prev, { producto, cantidad: 1, subtotal: Number(producto.precio) }]
    })
    toast.success(`${producto.nombre} agregado al carrito`, {
      style: { borderRadius: '12px', background: '#1A1A2E', color: '#fff' },
      iconTheme: { primary: '#FF6B35', secondary: '#fff' },
    })
  }, [])

  const cambiarCantidad = useCallback((productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito((prev) => prev.filter((i) => i.producto.id !== productoId))
      return
    }
    setCarrito((prev) =>
      prev.map((i) =>
        i.producto.id === productoId
          ? { ...i, cantidad: nuevaCantidad, subtotal: nuevaCantidad * Number(i.producto.precio) }
          : i
      )
    )
  }, [])

  const eliminarItem = useCallback((productoId) => {
    setCarrito((prev) => prev.filter((i) => i.producto.id !== productoId))
  }, [])

  const totalItems = carrito.reduce((acc, i) => acc + i.cantidad, 0)

  const handlePagar = async () => {
    if (!usuario) { setDrawerAbierto(false); navigate('/tienda/login'); return }
    setPagando(true)
    try {
      await pedidoService.crear(carrito)
      setCarrito([])
      setDrawerAbierto(false)
      navigate('/tienda/confirmacion')
    } catch (err) {
      toast.error(err.response?.data?.mensaje ?? 'Error al procesar el pedido')
    } finally {
      setPagando(false)
    }
  }

  return (
    <div className="tienda-root min-h-screen bg-white text-[#1A1A2E]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-black/5' : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">

            {/* Logo */}
            <Link to="/tienda" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-[#FF6B35] rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-base">F</span>
              </div>
              <span className="text-xl font-black text-[#1A1A2E] tracking-tight">
                FERRO<span className="text-[#FF6B35]">MAX</span>
              </span>
            </Link>

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href}
                  className="relative text-sm font-medium text-gray-600 hover:text-[#FF6B35] transition-colors group">
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF6B35] transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
              <Link to={CATALOGO_LINK.to}
                className="relative text-sm font-semibold text-[#FF6B35] hover:text-[#e55a2b] transition-colors group">
                {CATALOGO_LINK.label}
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#FF6B35]" />
              </Link>
            </nav>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              <button onClick={() => setBusquedaAbierta(!busquedaAbierta)}
                className="p-2.5 hover:bg-gray-100 rounded-full transition-colors">
                <Search size={18} className="text-gray-600" />
              </button>

              <button onClick={() => setDrawerAbierto(true)}
                className="relative p-2.5 hover:bg-gray-100 active:scale-95 rounded-full transition-colors">
                <ShoppingCart size={18} className="text-gray-600" />
                <AnimatePresence mode="popLayout">
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', duration: 0.35, bounce: 0.5 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    >
                      {totalItems > 9 ? '9+' : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {usuario ? (
                <div className="hidden md:flex items-center gap-2 ml-1">
                  <Link to="/tienda/mis-pedidos"
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#FF6B35] transition-colors px-3 py-2 rounded-full hover:bg-gray-100">
                    <ClipboardList size={14} /> Mis pedidos
                  </Link>
                  <button onClick={() => logout('/tienda')}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-500 transition-colors px-3 py-2 rounded-full hover:bg-red-50">
                    <LogOut size={14} /> Salir
                  </button>
                </div>
              ) : (
                <Link to="/tienda/login"
                  className="hidden md:flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors ml-1">
                  Ingresar <ArrowRight size={14} />
                </Link>
              )}

              <button onClick={() => setMenuMovil(!menuMovil)}
                className="md:hidden p-2.5 hover:bg-gray-100 rounded-full transition-colors">
                {menuMovil ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Buscador expandible */}
        <AnimatePresence>
          {busquedaAbierta && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-100 overflow-hidden"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar herramientas, productos..."
                  className="w-full px-6 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Menú móvil */}
      <AnimatePresence>
        {menuMovil && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-6"
          >
            <nav className="flex flex-col gap-6">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMenuMovil(false)}
                  className="text-2xl font-semibold text-[#1A1A2E] hover:text-[#FF6B35] transition-colors">
                  {link.label}
                </a>
              ))}
              <Link to={CATALOGO_LINK.to} onClick={() => setMenuMovil(false)}
                className="text-2xl font-semibold text-[#FF6B35]">
                {CATALOGO_LINK.label} →
              </Link>
              {usuario ? (
                <>
                  <Link to="/tienda/mis-pedidos" onClick={() => setMenuMovil(false)}
                    className="text-2xl font-semibold text-[#1A1A2E] hover:text-[#FF6B35]">
                    Mis pedidos
                  </Link>
                  <button onClick={() => logout('/tienda')}
                    className="text-2xl font-semibold text-red-500 text-left">
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link to="/tienda/login" onClick={() => setMenuMovil(false)}
                  className="text-2xl font-semibold text-[#FF6B35]">
                  Ingresar →
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section id="inicio" ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden pt-[72px]">

        {/* Video de fondo con parallax */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <video
            autoPlay loop muted playsInline
            className="w-full h-full object-cover opacity-80"
            style={{ height: '120%', marginTop: '-10%' }}
          >
            <source src="/worker-drill.mp4" type="video/mp4" />
          </video>
        </motion.div>

        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Degradado inferior hacia blanco */}
        <div className="absolute bottom-0 left-0 right-0 h-40" style={{
          background: 'linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.5) 75%, white 100%)'
        }} />

        {/* Contenido centrado con parallax suave */}
        <motion.div className="relative w-full py-20 text-center px-4" style={{ opacity: heroOpacity }}>

          <motion.span
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="inline-block bg-[#FF6B35] text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6"
          >
            Nueva Colección 2026
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-tight mb-4"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            HERRAMIENTAS<br />
            <motion.span
              className="text-[#FF6B35] inline-block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              PROFESIONALES
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="text-xl text-white/80 font-light mb-4"
          >
            Para quienes construyen el futuro
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="text-white/60 max-w-lg mx-auto mb-10 leading-relaxed"
          >
            Selección premium de herramientas eléctricas, manuales y equipos de seguridad.
            Calidad profesional al mejor precio.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-wrap justify-center gap-4"
          >
            <a href="#productos"
              className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e55a2b] active:scale-[0.97] text-white font-semibold px-8 py-4 rounded-full text-base transition-colors shadow-lg">
              Ver Productos <ArrowRight size={18} />
            </a>
            <a href="#nosotros"
              className="flex items-center gap-2 border-2 border-white text-white hover:bg-white hover:text-[#1A1A2E] active:scale-[0.97] font-semibold px-8 py-4 rounded-full text-base transition-all">
              Quiénes somos
            </a>
          </motion.div>

        </motion.div>

      </section>

      {/* ══ BARRA STATS ═════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
            {[
              { n: '+25',  label: 'Años en el mercado', Icono: Star   },
              { n: '+500', label: 'Productos en stock',  Icono: Package },
              { n: '12m',  label: 'De garantía',         Icono: Shield  },
              { n: '24h',  label: 'Despacho express',    Icono: Truck   },
            ].map(({ n, label, Icono }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex items-center gap-4 px-8 py-6"
              >
                <div className="w-11 h-11 bg-[#FF6B35]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Icono size={20} className="text-[#FF6B35]" />
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1A1A2E] leading-none">{n}</p>
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BANDA MARQUEE ═══════════════════════════════════════════════════ */}
      <div className="border-y border-gray-100 bg-[#F8F9FA] overflow-hidden">
        <div className="flex items-center gap-12 py-3 whitespace-nowrap animate-marquee w-max">
          {[...Array(3)].flatMap((_, rep) =>
            ['AMOLADORA 115MM', 'TALADRO 13MM', 'SOLDADORA 250A', 'COMPRESOR 50L',
             'ENVÍO A TODO EL PAÍS', 'GARANTÍA 12 MESES', 'ATENCIÓN ESPECIALIZADA', 'STOCK PERMANENTE'
            ].map((txt, i) => (
              <span key={`${rep}-${i}`} className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-3 px-4">
                <span className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full shrink-0" />
                {txt}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══ CATEGORÍAS DESTACADAS ═══════════════════════════════════════════ */}
      <CategoriasDestacadas />


      {/* ══ OFERTAS SEMANALES ═══════════════════════════════════════════════ */}
      <OfertasSemanales onAgregar={agregarAlCarrito} />
      {/* ══ SECCIÓN PRODUCTOS (oculta) ══════════════════════════════════════ */}
      <section id="productos" ref={productosRef} className="py-20 bg-[#F8F9FA] hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Título + buscador mobile */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E]"><span className="text-[#FF6B35]">Nuestros</span> Productos</h2>
              {!cargando && (
                <p className="text-gray-400 mt-1 text-sm">
                  {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? 's' : ''}
                  {categoriaActiva !== 'Todos' && ` en ${categoriaActiva}`}
                </p>
              )}
            </div>
            <div className="sm:hidden">
              <input
                type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="w-full px-5 py-3 bg-white rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
              />
            </div>
          </div>

          {/* Pills de categorías — sólo móvil/tablet (< lg) */}
          {!cargando && categorias.length > 2 && (
            <div className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 pb-5 overflow-x-auto scrollbar-none">
              <div className="flex gap-2 w-max">
                {GRUPOS_CATEGORIAS.concat([]).reduce((acc, { grupo, icono: Icono, cats }) => {
                  const catsDisponibles = cats.filter((c) => categorias.includes(c))
                  if (catsDisponibles.length === 0) return acc
                  acc.push({ label: grupo, Icono, cats: catsDisponibles })
                  return acc
                }, [{ label: 'Todos', Icono: LayoutGrid, cats: ['Todos'] }])
                  .map(({ label, Icono, cats: pillCats }) => {
                    const esActivo = label === 'Todos'
                      ? categoriaActiva === 'Todos'
                      : pillCats.includes(categoriaActiva)
                    const handleClick = () => {
                      if (label === 'Todos') { setCategoriaActiva('Todos'); return }
                      setCategoriaActiva(pillCats[0])
                    }
                    return (
                      <motion.button
                        key={label}
                        onClick={handleClick}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                          esActivo
                            ? 'bg-[#FF6B35] text-white shadow-sm shadow-orange-200'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35]'
                        }`}
                      >
                        <Icono size={11} />
                        {label}
                      </motion.button>
                    )
                  })
                }
              </div>
            </div>
          )}

          {/* Layout: sidebar izquierda + grilla */}
          <div className="flex gap-6 items-start">

            {/* ── Sidebar categorías (desktop) ── */}
            {!cargando && categorias.length > 2 && (
              <aside className="hidden lg:block w-56 shrink-0">
                <div
                  ref={dropdownRef}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  onMouseLeave={cerrarDropdown}
                >
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

                  {/* Grupos con hover */}
                  {GRUPOS_CATEGORIAS.map(({ grupo, icono: Icono, cats }) => {
                    const catsDisponibles = cats.filter((c) => categorias.includes(c))
                    if (catsDisponibles.length === 0) return null
                    const estaAbierto = grupoAbierto === grupo
                    const tieneActiva = catsDisponibles.includes(categoriaActiva)
                    return (
                      <div key={grupo} onMouseEnter={() => { clearTimeout(closeTimerRef.current); setGrupoAbierto(grupo) }}>
                        <div className={`flex items-center justify-between px-4 py-2.5 text-xs font-bold uppercase tracking-wide cursor-default select-none ${
                          tieneActiva ? 'text-[#FF6B35]' : estaAbierto ? 'text-[#1A1A2E]' : 'text-gray-400'
                        }`}>
                          <div className="flex items-center gap-2">
                            <Icono size={12} className={tieneActiva || estaAbierto ? 'text-[#FF6B35]' : 'text-gray-300'} />
                            <span>{grupo}</span>
                          </div>
                          <ChevronRight size={11} className={`transition-transform ${estaAbierto ? 'rotate-90 text-[#FF6B35]' : 'text-gray-300'}`} />
                        </div>

                        <AnimatePresence initial={false}>
                          {estaAbierto && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0 }}
                              className="overflow-hidden bg-gray-50/60"
                            >
                              {catsDisponibles.map((cat) => (
                                <button
                                  key={cat}
                                  onClick={() => setCategoriaActiva(cat)}
                                  className={`w-full flex items-center justify-between pl-8 pr-4 py-2 text-sm transition-colors ${
                                    categoriaActiva === cat
                                      ? 'text-[#FF6B35] font-semibold bg-[#FF6B35]/5'
                                      : 'text-gray-500 hover:text-[#FF6B35] hover:bg-white font-medium'
                                  }`}
                                >
                                  <span>{cat}</span>
                                  {categoriaActiva === cat && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>

              </aside>
            )}

            {/* ── Grilla de productos ── */}
            <div className="flex-1 min-w-0">

              {/* Barra superior: resultados + selector por página */}
              {!cargando && productosFiltrados.length > 0 && (
                <div className="flex items-center justify-between mb-5">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar productos..."
                      className="pl-8 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] w-48 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Mostrar</span>
                    {[8, 12, 24].map((n) => (
                      <button
                        key={n}
                        onClick={() => setPorPagina(n)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                          porPagina === n
                            ? 'bg-[#FF6B35] text-white'
                            : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {cargando ? <Spinner /> : (
                productosFiltrados.length === 0 ? (
                  <div className="text-center py-24 space-y-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Package size={36} className="text-gray-300" />
                    </div>
                    <p className="font-semibold text-gray-500">Sin resultados</p>
                    <button
                      onClick={() => { setBusqueda(''); setCategoriaActiva('Todos') }}
                      className="text-sm text-[#FF6B35] hover:underline font-medium"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                ) : (
                  <>
                    <motion.div
                      key={categoriaActiva + busqueda + pagina}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-5"
                    >
                      {productosPagina.map((p, i) => (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 32 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-40px' }}
                          transition={{ duration: 0.4, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        >
                          <ProductoCard producto={p} onAgregar={agregarAlCarrito} />
                        </motion.div>
                      ))}

                    </motion.div>

                    {/* Paginación numerada */}
                    {totalPaginas > 1 && (
                      <div className="flex items-center justify-center gap-1.5 mt-10">
                        {/* Anterior */}
                        <button
                          onClick={() => { setPagina((p) => Math.max(1, p - 1)); productosRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                          disabled={pagina === 1}
                          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-[#FF6B35] hover:text-[#FF6B35] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight size={15} className="rotate-180" />
                        </button>

                        {/* Números */}
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                          .filter((n) => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1)
                          .reduce((acc, n, idx, arr) => {
                            if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…')
                            acc.push(n)
                            return acc
                          }, [])
                          .map((n, i) =>
                            n === '…' ? (
                              <span key={`sep-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">…</span>
                            ) : (
                              <button
                                key={n}
                                onClick={() => { setPagina(n); productosRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                                  pagina === n
                                    ? 'bg-[#FF6B35] text-white shadow-sm shadow-orange-200'
                                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#FF6B35] hover:text-[#FF6B35]'
                                }`}
                              >
                                {n}
                              </button>
                            )
                          )
                        }

                        {/* Siguiente */}
                        <button
                          onClick={() => { setPagina((p) => Math.min(totalPaginas, p + 1)); productosRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                          disabled={pagina === totalPaginas}
                          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-[#FF6B35] hover:text-[#FF6B35] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIOS ═════════════════════════════════════════════════════ */}
      <Testimonios />

      {/* ══ NOSOTROS / FEATURES ═════════════════════════════════════════════ */}
      <section id="nosotros" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-3">¿Por qué elegirnos?</h2>
            <p className="text-gray-500">Más de 25 años siendo la ferretería de confianza</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { Icono: Zap,    titulo: 'Stock permanente',      desc: 'Más de 500 productos disponibles para entrega inmediata. Sin esperas ni demoras.',        color: 'bg-orange-50 text-[#FF6B35]' },
              { Icono: Shield, titulo: 'Garantía real',         desc: '12 meses de garantía en todos nuestros productos. Servicio técnico propio.',              color: 'bg-blue-50 text-blue-500' },
              { Icono: Truck,  titulo: 'Envío a todo el país',  desc: 'Despachamos a cualquier provincia. Embalaje reforzado y seguimiento online.',             color: 'bg-emerald-50 text-emerald-500' },
            ].map(({ Icono, titulo, desc, color }) => (
              <motion.div
                key={titulo}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="bg-[#F8F9FA] rounded-2xl p-8 text-center"
              >
                <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
                  <Icono size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A2E] mb-3">{titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="relative text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1629 0%, #1a1a2e 40%, #1f1025 100%)' }}>
        {/* Decoración sutil */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B35]/40 to-transparent" />
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-[#FF6B35]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#FF6B35]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">

          {/* Grid principal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">

            {/* Marca */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-[#FF6B35] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <span className="text-white font-black text-base">F</span>
                </div>
                <span className="text-xl font-black tracking-tight">
                  FERRO<span className="text-[#FF6B35]">MAX</span>
                </span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                Ferretería industrial argentina. Herramientas profesionales para quienes trabajan de verdad.
              </p>
              {/* Línea decorativa naranja */}
              <div className="mt-5 w-10 h-0.5 bg-[#FF6B35] rounded-full" />
            </div>

            {/* Contacto */}
            <div>
              <h4 className="font-bold mb-5 text-xs uppercase tracking-widest text-[#FF6B35]">Contacto</h4>
              <div className="space-y-3">
                {[
                  { Icono: Mail,  val: 'ventas@ferromax.com.ar' },
                  { Icono: Phone, val: '(011) 4523-8901' },
                ].map(({ Icono, val }) => (
                  <div key={val} className="flex items-center gap-3 text-sm text-white/50 hover:text-white/80 transition-colors cursor-default">
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      <Icono size={14} className="text-[#FF6B35]" />
                    </div>
                    {val}
                  </div>
                ))}
              </div>
            </div>

            {/* Horarios */}
            <div>
              <h4 className="font-bold mb-5 text-xs uppercase tracking-widest text-[#FF6B35]">Horarios</h4>
              <div className="space-y-3">
                {[
                  { dia: 'Lun – Vie', hr: '08:00 – 18:00' },
                  { dia: 'Sábados',   hr: '08:00 – 13:00' },
                  { dia: 'Domingos',  hr: 'Cerrado' },
                ].map(({ dia, hr }) => (
                  <div key={dia} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                      <Clock size={14} className="text-[#FF6B35]" />
                    </div>
                    <span className="text-white/50">{dia}</span>
                    <span className={`ml-auto font-semibold text-xs ${hr === 'Cerrado' ? 'text-red-400' : 'text-white'}`}>{hr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/25 text-xs">© 2026 Ferromax. Todos los derechos reservados.</p>
            <p className="text-white/20 text-xs">Hecho en Argentina 🇦🇷</p>
          </div>
        </div>
      </footer>

      {/* ══ DRAWER CARRITO ══════════════════════════════════════════════════ */}
      <AnimatePresence>
        {drawerAbierto && (
          <CarritoDrawer
            items={carrito}
            onCerrar={() => setDrawerAbierto(false)}
            onCambiarCantidad={cambiarCantidad}
            onEliminar={eliminarItem}
            onPagar={handlePagar}
            pagando={pagando}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
