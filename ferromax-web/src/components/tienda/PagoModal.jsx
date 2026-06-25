import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, CreditCard, CheckCircle, ChevronDown } from 'lucide-react'

function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

function detectarTarjeta(numero) {
  const n = numero.replace(/\s/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^(36|38|30[0-5])/.test(n)) return 'diners'
  if (/^(6011|622|64|65)/.test(n)) return 'discover'
  if (/^(589562|527571|527572)/.test(n)) return 'naranja'
  return null
}

function logoTarjeta(tipo) {
  const logos = {
    visa:       { text: 'VISA',       color: '#1a1f71', bg: 'bg-blue-900'    },
    mastercard: { text: 'MC',         color: '#eb001b', bg: 'bg-red-600'     },
    amex:       { text: 'AMEX',       color: '#007bc1', bg: 'bg-blue-500'    },
    diners:     { text: 'DINERS',     color: '#004b87', bg: 'bg-blue-700'    },
    discover:   { text: 'DISCOVER',   color: '#f76f20', bg: 'bg-orange-500'  },
    naranja:    { text: 'NARANJA',    color: '#f96d00', bg: 'bg-orange-500'  },
  }
  return logos[tipo] ?? null
}

function formatNumero(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatVenc(val) {
  const d = val.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d
}

function TarjetaPreview({ numero, nombre, vencimiento, cvv, mostrarCvv, tipo }) {
  const logo = logoTarjeta(tipo)
  const numMostrado = (numero || '').padEnd(19, ' ').slice(0, 19)

  return (
    <div className="relative w-full h-44 perspective-1000">
      <motion.div
        animate={{ rotateY: mostrarCvv ? 180 : 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Frente */}
        <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 50%, white 0%, transparent 50%)' }} />
          <div className="relative p-5 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-300 to-yellow-500 opacity-90" />
              {logo && (
                <span className="text-white font-black text-lg tracking-tight" style={{ color: logo.color === '#1a1f71' ? '#fff' : logo.color }}>
                  {logo.text}
                </span>
              )}
            </div>
            <div>
              <p className="text-white font-mono text-lg tracking-widest mb-3">
                {numMostrado}
              </p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Titular</p>
                  <p className="text-white font-semibold text-sm uppercase tracking-wide truncate max-w-[160px]">
                    {nombre || 'NOMBRE APELLIDO'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Vence</p>
                  <p className="text-white font-semibold text-sm">{vencimiento || 'MM/AA'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dorso */}
        <div className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', transform: 'rotateY(180deg)' }}>
          <div className="mt-6 h-10 bg-gray-800" />
          <div className="px-5 mt-5">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">CVV</p>
            <div className="bg-white rounded px-3 py-2 text-right">
              <span className="font-mono font-bold text-gray-800 tracking-widest">
                {cvv ? '•'.repeat(cvv.length) : '•••'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const CUOTAS = [
  { value: 1,  label: '1 cuota',  extra: '' },
  { value: 3,  label: '3 cuotas', extra: 'sin interés' },
  { value: 6,  label: '6 cuotas', extra: 'sin interés' },
  { value: 12, label: '12 cuotas', extra: '+ interés' },
  { value: 18, label: '18 cuotas', extra: '+ interés' },
]

const METODOS = [
  { id: 'tarjeta_credito', label: 'Tarjeta de crédito', icon: '💳' },
  { id: 'tarjeta_debito',  label: 'Tarjeta de débito',  icon: '🏦' },
  { id: 'efectivo',        label: 'Pago en efectivo',   icon: '💵' },
]

function PagoEfectivo({ total }) {
  const codigo = Math.random().toString(36).slice(2, 10).toUpperCase()
  return (
    <div className="space-y-4 text-center">
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <p className="text-sm text-yellow-700 font-medium mb-3">Código de pago en efectivo</p>
        <p className="font-mono text-3xl font-black text-yellow-800 tracking-widest">{codigo}</p>
        <p className="text-xs text-yellow-600 mt-3">Presentá este código en cualquier Rapipago, Pago Fácil o Red Link</p>
      </div>
      <p className="text-sm text-gray-500">Total a pagar: <strong className="text-gray-800">{formatPesos(total)}</strong></p>
      <p className="text-xs text-gray-400">El código vence en 72hs</p>
    </div>
  )
}

export default function PagoModal({ total, onCerrar, onProcesar, onPagoExitoso }) {
  const [metodo, setMetodo]       = useState('tarjeta_credito')
  const [numero, setNumero]       = useState('')
  const [nombre, setNombre]       = useState('')
  const [vencimiento, setVencimiento] = useState('')
  const [cvv, setCvv]             = useState('')
  const [cuotas, setCuotas]       = useState(1)
  const [mostrarCvv, setMostrarCvv] = useState(false)
  const [errores, setErrores]     = useState({})
  const [procesando, setProcesando] = useState(false)
  const [exito, setExito]         = useState(false)
  const [errorPago, setErrorPago]  = useState('')
  const cvvRef = useRef(null)

  const tipo = detectarTarjeta(numero)
  const esCredito = metodo === 'tarjeta_credito'
  const esDebito  = metodo === 'tarjeta_debito'
  const esTarjeta = esCredito || esDebito

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !procesando) onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar, procesando])

  function validar() {
    const e = {}
    if (esTarjeta) {
      if (numero.replace(/\s/g, '').length < 13) e.numero = 'Número inválido'
      if (!nombre.trim()) e.nombre = 'Requerido'
      const [mm, aa] = (vencimiento || '').split('/')
      if (!mm || !aa || Number(mm) > 12 || Number(mm) < 1 || aa.length < 2) e.vencimiento = 'Fecha inválida'
      if (cvv.length < 3) e.cvv = 'CVV inválido'
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  async function handlePagar() {
    if (!validar()) return
    setErrorPago('')
    setProcesando(true)
    const medioPago = metodo === 'efectivo' ? 'EFECTIVO' : metodo === 'tarjeta_debito' ? 'DEBITO' : 'CREDITO'
    // Simular delay del procesador de pago y crear el pedido en paralelo
    await new Promise((r) => setTimeout(r, 1500))
    try {
      await onProcesar(medioPago)
    } catch (err) {
      setProcesando(false)
      setErrorPago(err?.response?.data?.mensaje ?? 'No se pudo procesar el pago. Intentá de nuevo.')
      return
    }
    setExito(true)
    await new Promise((r) => setTimeout(r, 1200))
    onPagoExitoso()
  }

  if (exito) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-10 text-center max-w-sm w-full shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">¡Pago aprobado!</h2>
          <p className="text-gray-500 text-sm">Redirigiendo...</p>
        </motion.div>
      </div>
    )
  }

  if (procesando) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-10 text-center max-w-sm w-full shadow-2xl"
        >
          <div className="w-16 h-16 mx-auto mb-5 relative">
            <div className="w-16 h-16 border-4 border-[#009ee3]/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-[#009ee3] border-t-transparent rounded-full animate-spin absolute inset-0" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Procesando pago</h2>
          <p className="text-gray-400 text-sm">Por favor no cierres esta ventana...</p>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <Lock size={12} className="text-gray-300" />
            <span className="text-[11px] text-gray-300">Transacción segura · SSL</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto"
      >
        {/* Header estilo MP */}
        <div className="bg-[#009ee3] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#009ee3] font-black text-sm">MP</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">MercadoPago</p>
              <p className="text-blue-100 text-xs">Pago seguro</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-blue-100 text-xs">Total</p>
              <p className="text-white font-black text-lg">{formatPesos(total)}</p>
            </div>
            <button onClick={onCerrar}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Selector de método */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">¿Cómo querés pagar?</p>
            <div className="grid grid-cols-3 gap-2">
              {METODOS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMetodo(m.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-xs font-semibold transition-all ${
                    metodo === m.id
                      ? 'border-[#009ee3] bg-[#009ee3]/5 text-[#009ee3]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-center leading-tight">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {esTarjeta ? (
              <motion.div
                key="tarjeta"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Preview tarjeta */}
                <TarjetaPreview
                  numero={numero}
                  nombre={nombre}
                  vencimiento={vencimiento}
                  cvv={cvv}
                  mostrarCvv={mostrarCvv}
                  tipo={tipo}
                />

                {/* Número */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Número de tarjeta</label>
                  <div className={`flex items-center border-2 rounded-xl px-4 py-3 gap-3 transition-colors ${errores.numero ? 'border-red-300 bg-red-50' : 'border-gray-200 focus-within:border-[#009ee3]'}`}>
                    <CreditCard size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="tel"
                      value={numero}
                      onChange={(e) => setNumero(formatNumero(e.target.value))}
                      placeholder="1234 5678 9012 3456"
                      className="flex-1 outline-none text-sm font-mono text-gray-800 bg-transparent placeholder-gray-300"
                    />
                    {tipo && (
                      <span className="text-xs font-black text-gray-600">{logoTarjeta(tipo)?.text}</span>
                    )}
                  </div>
                  {errores.numero && <p className="text-xs text-red-500 mt-1">{errores.numero}</p>}
                </div>

                {/* Nombre */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nombre en la tarjeta</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value.toUpperCase())}
                    placeholder="JUAN PÉREZ"
                    className={`w-full border-2 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-colors placeholder-gray-300 ${errores.nombre ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#009ee3]'}`}
                  />
                  {errores.nombre && <p className="text-xs text-red-500 mt-1">{errores.nombre}</p>}
                </div>

                {/* Vencimiento + CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Vencimiento</label>
                    <input
                      type="tel"
                      value={vencimiento}
                      onChange={(e) => setVencimiento(formatVenc(e.target.value))}
                      placeholder="MM/AA"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-colors placeholder-gray-300 ${errores.vencimiento ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#009ee3]'}`}
                    />
                    {errores.vencimiento && <p className="text-xs text-red-500 mt-1">{errores.vencimiento}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">CVV</label>
                    <input
                      ref={cvvRef}
                      type="tel"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      onFocus={() => setMostrarCvv(true)}
                      onBlur={() => setMostrarCvv(false)}
                      placeholder="123"
                      className={`w-full border-2 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-colors placeholder-gray-300 ${errores.cvv ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#009ee3]'}`}
                    />
                    {errores.cvv && <p className="text-xs text-red-500 mt-1">{errores.cvv}</p>}
                  </div>
                </div>

                {/* Cuotas (solo crédito) */}
                {esCredito && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Cuotas</label>
                    <div className="relative">
                      <select
                        value={cuotas}
                        onChange={(e) => setCuotas(Number(e.target.value))}
                        className="w-full border-2 border-gray-200 focus:border-[#009ee3] rounded-xl px-4 py-3 text-sm text-gray-800 outline-none appearance-none bg-white transition-colors"
                      >
                        {CUOTAS.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}{c.extra ? ` — ${c.extra}` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {cuotas > 1 && (
                      <p className="text-xs text-[#009ee3] mt-1.5 font-medium">
                        {cuotas} × {formatPesos(cuotas <= 6 ? total / cuotas : (total * 1.15) / cuotas)}
                        {cuotas <= 6 ? ' sin interés' : ' (15% interés)'}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="efectivo"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PagoEfectivo total={total} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error de pago */}
          {errorPago && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm text-center">
              {errorPago}
            </div>
          )}

          {/* Botón pagar */}
          <button
            onClick={handlePagar}
            className="w-full py-4 bg-[#009ee3] hover:bg-[#0082c0] active:scale-[0.98] text-white font-bold rounded-2xl transition-colors active:transition-transform flex items-center justify-center gap-2 text-sm"
          >
            <Lock size={15} />
            {metodo === 'efectivo' ? 'Generar código de pago' : `Pagar ${formatPesos(total)}`}
          </button>

          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-gray-300">
              <Lock size={11} />
              <span className="text-[11px]">SSL 256-bit</span>
            </div>
            <span className="text-gray-200">·</span>
            <span className="text-[11px] text-gray-300">Todas las tarjetas aceptadas</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
