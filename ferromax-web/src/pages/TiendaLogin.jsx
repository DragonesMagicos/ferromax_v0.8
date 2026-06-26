import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, ArrowLeft, Wrench, Shield, Truck, Star, Check } from 'lucide-react'

const ease = [0.23, 1, 0.32, 1]

export default function TiendaLoginPage() {
  const { login, usuario, cargando } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const hayCarritoPendiente = !!location.state?.comprarDespues ||
    JSON.parse(localStorage.getItem('ferromax_carrito') || '[]').length > 0

  const [modo, setModo]     = useState('login')
  const [form, setForm]     = useState({ nombre: '', apellido: '', email: '', password: '' })
  const [verPass, setVerPass] = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    if (!cargando && usuario) {
      navigate('/tienda', { replace: true, state: hayCarritoPendiente ? { comprarAhora: true } : {} })
    }
  }, [usuario, cargando, navigate])

  const destino = () => navigate('/tienda', { replace: true, state: hayCarritoPendiente ? { comprarAhora: true } : {} })

  const set = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const ok = await login(form.email, form.password)
    if (ok) destino()
    else { setError('Email o contraseña incorrectos.'); setLoading(false) }
  }

  const handleRegistro = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    try {
      await authService.register({ nombre: form.nombre, apellido: form.apellido, email: form.email, password: form.password })
      const ok = await login(form.email, form.password)
      if (ok) destino()
    } catch (err) {
      setError(err.response?.data?.mensaje ?? 'No se pudo crear la cuenta.')
      setLoading(false)
    }
  }

  if (cargando) return null

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Panel izquierdo (marca) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A2E] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FF6B35]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-[#FF6B35]/5 rounded-full blur-3xl" />

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
            FERRE<span className="text-[#FF6B35]">MAX</span>
          </span>
        </motion.div>

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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="relative grid grid-cols-2 gap-4"
        >
          {[
            { n: '+25 años', label: 'en el mercado',   Icono: Star   },
            { n: '+500',     label: 'productos en stock', Icono: Wrench },
            { n: '12 meses', label: 'de garantía',     Icono: Shield },
            { n: '24 hs',    label: 'despacho express', Icono: Truck  },
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
          <Link to="/tienda" className="flex items-center gap-2 mb-10 lg:hidden w-fit">
            <div className="w-9 h-9 bg-[#FF6B35] rounded-xl flex items-center justify-center">
              <span className="text-white font-black">F</span>
            </div>
            <span className="text-xl font-black text-[#1A1A2E] tracking-tight"
              style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              FERRE<span className="text-[#FF6B35]">MAX</span>
            </span>
          </Link>

          {/* Título */}
          <div className="mb-7">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={modo}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease }}
              >
                <h1 className="text-2xl font-bold text-[#1A1A2E] mb-1">
                  {modo === 'login' ? 'Bienvenido' : 'Crear cuenta'}
                </h1>
                <p className="text-gray-500 text-sm">
                  {modo === 'login'
                    ? 'Ingresá con tu cuenta para continuar'
                    : 'Completá tus datos para registrarte'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Tabs */}
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 mb-7">
            {['login', 'registro'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setModo(tab); setError(''); setVerPass(false) }}
                className={`relative flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  modo === tab ? 'text-white' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {modo === tab && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-[#FF6B35] rounded-lg"
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                  />
                )}
                <span className="relative">
                  {tab === 'login' ? 'Ingresar' : 'Registrarse'}
                </span>
              </button>
            ))}
          </div>

          {/* Formulario */}
          <AnimatePresence mode="wait" initial={false}>
            {modo === 'login' ? (
              <motion.form
                key="login"
                onSubmit={handleLogin}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22, ease }}
                className="space-y-4"
              >
                <InputField
                  label="Email" type="email" value={form.email}
                  onChange={set('email')} placeholder="tu@email.com"
                  required autoFocus
                  focused={focusedField === 'email'}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                <InputField
                  label="Contraseña" type={verPass ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  placeholder="••••••••" required
                  focused={focusedField === 'pass'}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  suffix={
                    <button type="button" onClick={() => setVerPass(!verPass)}
                      className="p-1 text-gray-400 hover:text-gray-600 active:scale-90 transition-all">
                      {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <ErrorMsg texto={error} />
                <SubmitBtn loading={loading} texto="Ingresar" />
              </motion.form>
            ) : (
              <motion.form
                key="registro"
                onSubmit={handleRegistro}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.22, ease }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Nombre" value={form.nombre} onChange={set('nombre')}
                    placeholder="Juan" required
                    focused={focusedField === 'nombre'}
                    onFocus={() => setFocusedField('nombre')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <InputField
                    label="Apellido" value={form.apellido} onChange={set('apellido')}
                    placeholder="Pérez"
                    focused={focusedField === 'apellido'}
                    onFocus={() => setFocusedField('apellido')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <InputField
                  label="Email" type="email" value={form.email}
                  onChange={set('email')} placeholder="tu@email.com" required
                  focused={focusedField === 'email2'}
                  onFocus={() => setFocusedField('email2')}
                  onBlur={() => setFocusedField(null)}
                />
                <InputField
                  label="Contraseña" type={verPass ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  placeholder="Mínimo 6 caracteres" required
                  focused={focusedField === 'pass2'}
                  onFocus={() => setFocusedField('pass2')}
                  onBlur={() => setFocusedField(null)}
                  suffix={
                    <button type="button" onClick={() => setVerPass(!verPass)}
                      className="p-1 text-gray-400 hover:text-gray-600 active:scale-90 transition-all">
                      {verPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <ErrorMsg texto={error} />
                <SubmitBtn loading={loading} texto="Crear cuenta" />
              </motion.form>
            )}
          </AnimatePresence>

          {/* Volver */}
          <p className="text-center mt-6 text-sm text-gray-400">
            <Link to="/tienda"
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-[#FF6B35] transition-colors font-medium">
              <ArrowLeft size={14} /> Volver a la tienda
            </Link>
          </p>

          <p className="text-center mt-6 text-xs text-gray-300">© 2026 Ferromax S.R.L.</p>
        </motion.div>
      </div>
    </div>
  )
}

function InputField({ label, focused, suffix, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className={`relative transition-all duration-150 rounded-xl ${focused ? 'ring-2 ring-[#FF6B35]/30' : ''}`}>
        <input
          {...props}
          className="w-full bg-white border border-gray-200 focus:border-[#FF6B35] rounded-xl px-4 py-3 text-sm text-[#1A1A2E] placeholder-gray-300 outline-none transition-colors"
          style={suffix ? { paddingRight: '2.75rem' } : {}}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
      </div>
    </div>
  )
}

function ErrorMsg({ texto }) {
  return (
    <AnimatePresence>
      {texto && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
        >
          <span className="text-red-500 font-bold text-sm shrink-0 mt-0.5">!</span>
          <p className="text-red-600 text-xs leading-relaxed">{texto}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function SubmitBtn({ loading, texto }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] disabled:opacity-60 text-white font-bold rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2 text-sm mt-2"
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span key="loading" className="flex items-center gap-2"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Procesando...
          </motion.span>
        ) : (
          <motion.span key="idle" className="flex items-center gap-2"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}>
            {texto} <ArrowRight size={16} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
