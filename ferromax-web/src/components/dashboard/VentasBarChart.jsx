import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatearEje(valor) {
  if (valor >= 1000) return `$${(valor / 1000).toFixed(0)}k`
  return `$${valor}`
}

function TooltipPersonalizado({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-sm">
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-violet-700 font-semibold">
        ${Number(payload[0].value).toLocaleString('es-AR')}
      </p>
    </div>
  )
}

export default function VentasBarChart({ datos = [] }) {
  const data = datos.map((d) => ({
    dia: DIAS[new Date(d.fecha + 'T12:00:00').getDay()],
    total: Number(d.total),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="dia" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatearEje} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: '#ede9fe' }} />
        <Bar dataKey="total" fill="#7C3AED" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
