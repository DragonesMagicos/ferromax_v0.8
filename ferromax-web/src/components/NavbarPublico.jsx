import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown, ShoppingCart, LogOut, ClipboardList } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import catalogoService from '../services/catalogoService'

export default function NavbarPublico({ carritoCount = 0, onAbrirCarrito }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const [scrolled,       setScrolled]       = useState(false)
  const [menuMovil,      setMenuMovil]       = useState(false)
  const [dropdownAbierto, setDropdownAbierto] = useState(false)
  const [categorias,     setCategorias]      = useState([])
  const dropdownRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    catalogoService.listarCategorias()
      .then(setCategorias)
      .catch(() => {})
  }, [])

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAbierto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const irACategoria = (nombre) => {
    setDropdownAbierto(false)
    setMenuMovil(false)
    navigate(`/catalogo/${encodeURIComponent(nombre)}`)
  }

  return (
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
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/tienda"
              className="text-sm font-medium text-gray-600 hover:text-[#FF6B35] transition-colors">
              Inicio
            </Link>

            {/* Dropdown Catálogo */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownAbierto(!dropdownAbierto)}
                className="flex items-center gap-1 text-sm font-medium text-[#FF6B35] transition-colors"
              >
                Catálogo
                <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownAbierto ? 'rotate-180' : ''}`} />
              </button>

              {dropdownAbierto && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  <Link
                    to="/catalogo"
                    onClick={() => setDropdownAbierto(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#1A1A2E] hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                  >
                    Ver todas las categorías
                  </Link>
                  <div className="border-t border-gray-100 my-1" />
                  {categorias.slice(0, 10).map((cat) => (
                    <button
                      key={cat.nombre}
                      onClick={() => irACategoria(cat.nombre)}
                      className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#FF6B35] transition-colors"
                    >
                      <span className="truncate">{cat.nombre}</span>
                      <span className="text-xs text-gray-400 ml-2 shrink-0">{cat.totalProductos}</span>
                    </button>
                  ))}
                  {categorias.length > 10 && (
                    <Link
                      to="/catalogo"
                      onClick={() => setDropdownAbierto(false)}
                      className="block px-4 py-2 text-xs text-[#FF6B35] hover:underline font-medium"
                    >
                      Ver todas ({categorias.length})…
                    </Link>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {onAbrirCarrito && (
              <button
                onClick={onAbrirCarrito}
                className="relative p-2.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ShoppingCart size={18} className="text-gray-600" />
                {carritoCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {carritoCount > 9 ? '9+' : carritoCount}
                  </span>
                )}
              </button>
            )}

            {usuario ? (
              <div className="hidden md:flex items-center gap-1">
                <Link to="/tienda/mis-pedidos"
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#FF6B35] px-3 py-2 rounded-full hover:bg-gray-100 transition-colors">
                  <ClipboardList size={14} /> Mis pedidos
                </Link>
                <button
                  onClick={() => logout('/tienda')}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-red-500 px-3 py-2 rounded-full hover:bg-red-50 transition-colors">
                  <LogOut size={14} /> Salir
                </button>
              </div>
            ) : (
              <Link to="/tienda/login"
                className="hidden md:flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
                Ingresar
              </Link>
            )}

            <button
              onClick={() => setMenuMovil(!menuMovil)}
              className="md:hidden p-2.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              {menuMovil ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {menuMovil && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-6 space-y-5">
          <Link to="/tienda" onClick={() => setMenuMovil(false)}
            className="block text-lg font-semibold text-[#1A1A2E] hover:text-[#FF6B35]">
            Inicio
          </Link>
          <Link to="/catalogo" onClick={() => setMenuMovil(false)}
            className="block text-lg font-semibold text-[#FF6B35]">
            Catálogo completo
          </Link>
          <div className="pl-4 space-y-3 border-l-2 border-orange-100">
            {categorias.map((cat) => (
              <button key={cat.nombre} onClick={() => irACategoria(cat.nombre)}
                className="block w-full text-left text-sm text-gray-600 hover:text-[#FF6B35]">
                {cat.nombre}
              </button>
            ))}
          </div>
          {usuario ? (
            <>
              <Link to="/tienda/mis-pedidos" onClick={() => setMenuMovil(false)}
                className="block text-lg font-semibold text-[#1A1A2E] hover:text-[#FF6B35]">
                Mis pedidos
              </Link>
              <button onClick={() => logout('/tienda')}
                className="text-lg font-semibold text-red-500">
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/tienda/login" onClick={() => setMenuMovil(false)}
              className="block text-lg font-semibold text-[#FF6B35]">
              Ingresar →
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
