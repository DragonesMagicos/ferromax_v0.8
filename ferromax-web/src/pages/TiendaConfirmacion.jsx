import { Link } from 'react-router-dom'

export default function TiendaConfirmacionPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-md w-full space-y-5">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold text-gray-800">¡Pedido recibido!</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Tu pedido fue registrado correctamente. Nos pondremos en contacto a la brevedad para coordinar la entrega o el retiro.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/tienda"
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:border-violet-400 hover:text-violet-700 transition-colors text-center"
          >
            Seguir comprando
          </Link>
          <Link
            to="/tienda/mis-pedidos"
            className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors text-center"
          >
            Ver mis pedidos
          </Link>
        </div>
      </div>
    </div>
  )
}
