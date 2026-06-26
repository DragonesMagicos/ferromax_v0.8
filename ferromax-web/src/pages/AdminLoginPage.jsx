import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, LogIn, LayoutDashboard, ShieldCheck, BarChart3, Package } from 'lucide-react'

const ease = [0.23, 1, 0.32, 1]

export default function AdminLoginPage() {
  const { login, logout, usuario, cargando } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [verPass, setVerPass]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    if (!cargando && usuario) {
      if (usuario.rol === 'CLIENTE') {
        logout('/admin/login')
      } else if (usuario.rol === 'EMPLEADO') {
        navigate('/pos', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    }
  }, [usuario, cargando, navigate, logout])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(email, password)
    if (ok) {
      const guardado = JSON.parse(localStorage.getItem('usuario') || '{}')
      if (guardado.rol === 'CLIENTE') {
        logout('/admin/login')
        setError('Esta área es exclusiva para empleados de Ferromax.')
        setLoading(false)
      } else if (guardado.rol === 'EMPLEADO') {
        navigate('/pos', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } else {
      setError('Credenciales incorrectas. Verificá tu email y contraseña.')
      setLoading(false)
    }
  }

  if (cargando) return null

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Panel izquierdo ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#0F172A] relative overflow-hidden flex-col justify-between p-12">

        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-indigo-600/8 rounded-full blur-3xl" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="relative flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-[#FF6B35] rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-lg">F</span>
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              FERRE<span className="text-[#FF6B35]">MAX</span>
            </span>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium -mt-0.5">
              Panel interno
            </p>
          </div>
        </motion.div>

        {/* Texto central */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-6">
            <ShieldCheck size={12} className="text-blue-400" />
            <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
              Acceso restringido
            </span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-black text-white leading-tight mb-4"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            SISTEMA DE<br />
            GESTIÓN<br />
            <span className="text-[#FF6B35]">FERROMAX</span>
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Área exclusiva para administradores y empleados de la empresa.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28, ease }}
          className="relative space-y-3"
        >
          {[
            { Icono: LayoutDashboard, label: 'Dashboard y reportes en tiempo real' },
            { Icono: Package,         label: 'Gestión de stock e inventario' },
            { Icono: BarChart3,       label: 'Ventas, remitos y facturación' },
          ].map(({ Icono, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.32 + i * 0.08, ease }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                <Icono size={15} className="text-gray-400" />
              </div>
              <span className="text-gray-400 text-sm">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex items-center justify-center bg-[#F1F5F9] px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="w-full max-w-sm"
        >

          {/* Logo móvil */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-9 h-9 bg-[#FF6B35] rounded-xl flex items-center justify-center">
              <span className="text-white font-black">F</span>
            </div>
            <span className="text-xl font-black text-[#0F172A] tracking-tight"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              FERRE<span className="text-[#FF6B35]">MAX</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Acceso al sistema</h1>
            <p className="text-slate-500 text-sm">Ingresá con tus credenciales de empleado</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email corporativo
              </label>
              <div className={`relative transition-all duration-150 rounded-xl ${
                focusedField === 'email' ? 'ring-2 ring-blue-500/25' : ''
              }`}>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="nombre@ferromax.com"
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder-slate-300 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Contraseña
              </label>
              <div className={`relative transition-all duration-150 rounded-xl ${
                focusedField === 'pass' ? 'ring-2 ring-blue-500/25' : ''
              }`}>
                <input
                  type={verPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 pr-11 text-sm text-[#0F172A] placeholder-slate-300 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setVerPass(!verPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 active:scale-90 transition-all"
                >
                  {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

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

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className="w-full bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-60 text-white font-bold rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2 text-sm mt-2"
            >
              <AnimatePresence mode="wait" initial={false}>
                {loading ? (
                  <motion.span key="loading" className="flex items-center gap-2"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verificando...
                  </motion.span>
                ) : (
                  <motion.span key="idle" className="flex items-center gap-2"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}>
                    <LogIn size={16} /> Ingresar al sistema
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <p className="text-center mt-8 text-xs text-slate-300">
            © 2026 Ferromax S.R.L. — Uso interno
          </p>
        </motion.div>
      </div>
    </div>
  )
}
