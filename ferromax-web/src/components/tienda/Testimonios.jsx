import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const TESTIMONIOS = [
  {
    nombre: 'Marcelo Fernández',
    cargo: 'Electricista matriculado',
    avatar: 'MF',
    color: 'bg-blue-500',
    estrellas: 5,
    texto: 'Compro en Ferromax hace más de 3 años. Los precios son imbatibles y la calidad de los productos superó mis expectativas. El envío llegó en menos de 24 horas. Recomendado 100%.',
    producto: 'Taladro Percutor 13mm',
  },
  {
    nombre: 'Carla Gómez',
    cargo: 'Arquitecta',
    avatar: 'CG',
    color: 'bg-rose-500',
    estrellas: 5,
    texto: 'Excelente atención al cliente. Tuve una consulta sobre la amoladora y me respondieron al instante con todo el detalle técnico que necesitaba. El producto llegó perfectamente embalado.',
    producto: 'Amoladora Angular 115mm',
  },
  {
    nombre: 'Roberto Sánchez',
    cargo: 'Constructor independiente',
    avatar: 'RS',
    color: 'bg-emerald-500',
    estrellas: 5,
    texto: 'La soldadora que compré es una bestia. Llevo 6 meses usándola todos los días y no le falla. El precio fue muchísimo mejor que en cualquier otro lado. Mi ferretería de cabecera.',
    producto: 'Soldadora Inversora 250A',
  },
  {
    nombre: 'Diego Martínez',
    cargo: 'Técnico en refrigeración',
    avatar: 'DM',
    color: 'bg-violet-500',
    estrellas: 5,
    texto: 'Hice mi primer pedido con dudas, pero fue todo perfecto. El stock es real, no como otras páginas que te dicen que hay y después no tienen. Volvería a comprar sin pensarlo.',
    producto: 'Compresor de Aire 50L',
  },
  {
    nombre: 'Luciana Torres',
    cargo: 'Diseñadora de interiores',
    avatar: 'LT',
    color: 'bg-amber-500',
    estrellas: 5,
    texto: 'Me sorprendió la variedad de productos. Encontré todo lo que necesitaba en un solo lugar y a muy buen precio. El servicio postventa también es excelente, resolvieron mi consulta rápidamente.',
    producto: 'Lijadora Orbital',
  },
  {
    nombre: 'Pablo Herrera',
    cargo: 'Plomero profesional',
    avatar: 'PH',
    color: 'bg-cyan-500',
    estrellas: 5,
    texto: 'La calidad de las herramientas es de primera. Las uso a diario en obras y aguantan todo. El precio es justo y la entrega fue rapidísima. No compro en otro lado desde que los descubrí.',
    producto: 'Sierra Circular 7¼"',
  },
  {
    nombre: 'Sofía Ramírez',
    cargo: 'Contratista',
    avatar: 'SR',
    color: 'bg-pink-500',
    estrellas: 5,
    texto: 'Pedí la pistola de calor un martes y el jueves ya la tenía en casa. Funciona perfecto y el precio fue increíble. Muy contenta con la compra, ya hice un segundo pedido.',
    producto: 'Pistola de Calor 2000W',
  },
  {
    nombre: 'Andrés Villalba',
    cargo: 'Carpintero',
    avatar: 'AV',
    color: 'bg-orange-500',
    estrellas: 5,
    texto: 'Llevo años comprando herramientas y nunca había tenido una experiencia tan fluida. Todo claro, rápido y el producto exactamente como se describe. 100% recomendable.',
    producto: 'Martillo Demoledor SDS',
  },
  {
    nombre: 'Gabriela López',
    cargo: 'Jefa de obra',
    avatar: 'GL',
    color: 'bg-teal-500',
    estrellas: 5,
    texto: 'Compramos para toda la cuadrilla y el pedido llegó completo y bien embalado. La atención fue muy profesional. Sin duda seguiremos eligiendo Ferromax para nuestras obras.',
    producto: 'Motosierra 45cc',
  },
]

// Intervalos distintos por slot (ms)
const INTERVALOS = [7000, 10000, 8500]

function siguienteAleatorio(actual, usados) {
  const disponibles = TESTIMONIOS
    .map((_, i) => i)
    .filter((i) => !usados.includes(i) || usados.length >= TESTIMONIOS.length)
  const pool = disponibles.length > 0 ? disponibles : TESTIMONIOS.map((_, i) => i).filter((i) => i !== actual)
  return pool[Math.floor(Math.random() * pool.length)]
}

function Estrellas({ cantidad }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={13} className={i < cantidad ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  )
}

function TarjetaTestimonio({ t }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4 h-full">
      <Quote size={20} className="text-[#FF6B35]/30 fill-[#FF6B35]/20" />
      <p className="text-sm text-gray-600 leading-relaxed flex-1">"{t.texto}"</p>
      <div className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-widest bg-[#FF6B35]/5 px-3 py-1.5 rounded-full w-fit">
        {t.producto}
      </div>
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center shrink-0`}>
          <span className="text-white text-xs font-black">{t.avatar}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A1A2E] truncate">{t.nombre}</p>
          <p className="text-[11px] text-gray-400 truncate">{t.cargo}</p>
        </div>
        <Estrellas cantidad={t.estrellas} />
      </div>
    </div>
  )
}

function SlotTestimonio({ indiceInicial, intervalo }) {
  const [indice, setIndice] = useState(indiceInicial)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndice((prev) => siguienteAleatorio(prev, [prev]))
    }, intervalo)
    return () => clearInterval(timer)
  }, [intervalo])

  return (
    <div className="relative min-h-[280px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={indice}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 2.5, ease: [0.23, 1, 0.32, 1] }}
          className="h-full"
        >
          <TarjetaTestimonio t={TESTIMONIOS[indice]} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function Testimonios() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-600 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
            <Star size={11} className="fill-yellow-400 text-yellow-400" /> Opiniones verificadas
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E]">
            Lo que dicen nuestros <span className="text-[#FF6B35]">clientes</span>
          </h2>
          <p className="text-gray-400 mt-2 text-sm">Más de 2.000 clientes satisfechos nos respaldan</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SlotTestimonio indiceInicial={0} intervalo={INTERVALOS[0]} />
          <SlotTestimonio indiceInicial={3} intervalo={INTERVALOS[1]} />
          <div className="hidden sm:block">
            <SlotTestimonio indiceInicial={6} intervalo={INTERVALOS[2]} />
          </div>
        </div>

      </div>
    </section>
  )
}
