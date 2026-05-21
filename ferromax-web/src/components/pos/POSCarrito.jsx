function formatPesos(n) {
  return Number(n ?? 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

export default function POSCarrito({ items, onCambiarCantidad, onEliminar }) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm select-none">
        <div className="text-center space-y-2">
          <div className="text-4xl">🛒</div>
          <p>El carrito está vacío</p>
          <p className="text-xs">Escaneá o buscá un producto para comenzar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
      {items.map((item) => (
        <div key={item.producto.id} className="flex items-center gap-3 py-3 px-1">
          {/* Info producto */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{item.producto.nombre}</p>
            <p className="text-xs text-gray-400 font-mono">{item.producto.sku}</p>
          </div>

          {/* Controles cantidad */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onCambiarCantidad(item.producto.id, item.cantidad - 1)}
              className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-base flex items-center justify-center transition-colors leading-none"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-semibold text-gray-800 tabular-nums">
              {item.cantidad}
            </span>
            <button
              onClick={() => onCambiarCantidad(item.producto.id, item.cantidad + 1)}
              className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-base flex items-center justify-center transition-colors leading-none"
            >
              +
            </button>
          </div>

          {/* Precio unitario */}
          <div className="w-24 text-right shrink-0">
            <p className="text-sm font-semibold text-gray-800">{formatPesos(item.subtotal)}</p>
            <p className="text-xs text-gray-400">{formatPesos(item.producto.precio)} c/u</p>
          </div>

          {/* Eliminar */}
          <button
            onClick={() => onEliminar(item.producto.id)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
            title="Eliminar"
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  )
}
