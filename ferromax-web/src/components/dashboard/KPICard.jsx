import { motion } from 'framer-motion'

const config = {
  verde: {
    icon:  'bg-emerald-50 text-emerald-500',
    value: 'text-[#1A1A2E]',
    badge: 'bg-emerald-50 text-emerald-600',
    dot:   'bg-emerald-400',
  },
  rojo: {
    icon:  'bg-red-50 text-red-500',
    value: 'text-red-600',
    badge: 'bg-red-50 text-red-600',
    dot:   'bg-red-400',
  },
  azul: {
    icon:  'bg-blue-50 text-blue-500',
    value: 'text-[#1A1A2E]',
    badge: 'bg-blue-50 text-blue-600',
    dot:   'bg-blue-400',
  },
  naranja: {
    icon:  'bg-[#FF6B35]/10 text-[#FF6B35]',
    value: 'text-[#1A1A2E]',
    badge: 'bg-[#FF6B35]/10 text-[#FF6B35]',
    dot:   'bg-[#FF6B35]',
  },
  gris: {
    icon:  'bg-gray-100 text-gray-500',
    value: 'text-[#1A1A2E]',
    badge: 'bg-gray-100 text-gray-500',
    dot:   'bg-gray-400',
  },
}

export default function KPICard({ titulo, valor, subtitulo, color = 'gris', Icono, staggerIndex = 0 }) {
  const c = config[color] ?? config.gris

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: staggerIndex * 0.08, ease: [0.23, 1, 0.32, 1] }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        {Icono && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.icon}`}>
            <Icono size={20} />
          </div>
        )}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${c.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
          {titulo}
        </div>
      </div>

      <p
        className={`text-3xl font-black tracking-tight leading-none mb-2 ${c.value}`}
        style={{ fontFamily: "'Rajdhani', sans-serif" }}
      >
        {valor}
      </p>

      {subtitulo && (
        <p className="text-xs text-gray-400">{subtitulo}</p>
      )}
    </motion.div>
  )
}
