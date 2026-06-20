import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, Wrench, Shield, Truck, Star } from 'lucide-react'

const ease = [0.23, 1, 0.32, 1]

export default function LoginPage() {
  const { login, usuario, cargando } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [verPass, setVerPass]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    if (!cargando && usuario) {
      if (usuario.rol === 'CLIENTE') navigate('/tienda', { replace: true })
      else if (usuario.rol === 'EMPLEADO') navigate('/pos', { replace: true })
      else navigate('/', { replace: true })
    }
  }, [usuario, cargando, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(email, password)
    if (ok) {
      const guardado = JSON.parse(localStorage.getItem('usuario') || '{}')
      if (guardado.rol === 'CLIENTE') navigate('/tienda', { replace: true })
      else if (guardado.rol === 'EMPLEADO') navigate('/pos', { replace: true })
      else navigate('/', { replace: true })
    } else {
      setError('Credenciales incorrectas. Verificá tu email y contraseña.')
      setLoading(false)
    }
  }

  if (cargando) return null

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Panel izquierdo (marca) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A2E] relative overflow-hidden flex-col justify-between p-12">

        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-[#FF6B35]/5 rounded-full blur-3xl" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="relative flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-[#FF6B35] rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-lg">F</span>
          </div>
          <span className="text-2xl font-black text-white tracking-tight"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            FERRO<span className="text-[#FF6B35]">MAX</span>
          </span>
        </motion.div>

        {/* Texto central */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease }}
          className="relative"
        >
          <p className="text-[#FF6B35] text-sm font-semibold uppercase tracking-widest mb-4">
            Ferretería Industrial Argentina
          </p>
          <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-6"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            HERRAMIENTAS<br />
            PARA QUIENES<br />
            <span className="text-[#FF6B35]">CONSTRUYEN</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            Más de 500 productos en stock. Calidad profesional al mejor precio del mercado.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="relative grid grid-cols-2 gap-4"
        >
          {[
            { n: '+25 años', label: 'en el mercado', Icono: Star },
            { n: '+500',     label: 'productos en stock', Icono: Wrench },
            { n: '12 meses', label: 'de garantía', Icono: Shield },
            { n: '24 hs',    label: 'despacho express', Icono: Truck },
          ].map(({ n, label, Icono }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 + i * 0.07, ease }}
              className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3"
            >
              <div className="w-8 h-8 bg-[#FF6B35]/15 rounded-lg flex items-center justify-center shrink-0">
                <Icono size={15} className="text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-none">{n}</p>
                <p className="text-gray-500 text-[11px] mt-0.5">{label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FA] px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="w-full max-w-sm"
        >

          {/* Logo móvil */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-[#FF6B35] rounded-xl flex items-center justify-center">
              <span className="text-white font-black">F</span>
            </div>
            <span className="text-xl font-black text-[#1A1A2E] tracking-tight"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              FERRO<span className="text-[#FF6B35]">MAX</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1A1A2E] mb-1">Bienvenido</h1>
            <p className="text-gray-500 text-sm">Ingresá con tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Campo email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Email
              </label>
              <div className={`relative transition-all duration-150 ${
                focusedField === 'email' ? 'ring-2 ring-[#FF6B35]/30 rounded-xl' : ''
              }`}>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="tu@email.com"
                  className="w-full bg-white border border-gray-200 focus:border-[#FF6B35] rounded-xl px-4 py-3 text-sm text-[#1A1A2E] placeholder-gray-300 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Campo contraseña */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Contraseña
              </label>
              <div className={`relative transition-all duration-150 ${
                focusedField === 'pass' ? 'ring-2 ring-[#FF6B35]/30 rounded-xl' : ''
              }`}>
                <input
                  type={verPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-200 focus:border-[#FF6B35] rounded-xl px-4 py-3 pr-11 text-sm text-[#1A1A2E] placeholder-gray-300 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setVerPass(!verPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 active:scale-90 transition-all"
                >
                  {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2, ease }}
                  className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                >
                  <span className="text-red-500 font-bold text-sm shrink-0 mt-0.5">!</span>
                  <p className="text-red-600 text-xs leading-relaxed">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón */}
            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] disabled:opacity-60 text-white font-bold rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2 text-sm mt-2"
            >
              <AnimatePresence mode="wait" initial={false}>
                {loading ? (
                  <motion.span
                    key="loading"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ingresando...
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    Ingresar <ArrowRight size={16} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          {/* Volver a la tienda */}
          <p className="text-center mt-6 text-sm text-gray-400">
            ¿Solo querés ver productos?{' '}
            <Link to="/tienda" className="text-[#FF6B35] font-semibold hover:underline">
              Ir a la tienda
            </Link>
          </p>

          <p className="text-center mt-8 text-xs text-gray-300">
            © 2026 Ferromax S.R.L.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
