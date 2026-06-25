import { createContext, useContext, useState, useCallback } from 'react'
import toast from 'react-hot-toast'

const CarritoContext = createContext(null)

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState([])
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  const agregarAlCarrito = useCallback((producto) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.producto.id === producto.id)
      if (existe) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * Number(i.producto.precio) }
            : i
        )
      }
      return [...prev, { producto, cantidad: 1, subtotal: Number(producto.precio) }]
    })
    toast.success(`${producto.nombre} agregado al carrito`, {
      style: { borderRadius: '12px', background: '#1A1A2E', color: '#fff' },
      iconTheme: { primary: '#FF6B35', secondary: '#fff' },
    })
  }, [])

  const cambiarCantidad = useCallback((productoId, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito((prev) => prev.filter((i) => i.producto.id !== productoId))
      return
    }
    setCarrito((prev) =>
      prev.map((i) =>
        i.producto.id === productoId
          ? { ...i, cantidad: nuevaCantidad, subtotal: nuevaCantidad * Number(i.producto.precio) }
          : i
      )
    )
  }, [])

  const eliminarItem = useCallback((productoId) => {
    setCarrito((prev) => prev.filter((i) => i.producto.id !== productoId))
  }, [])

  const limpiarCarrito = useCallback(() => setCarrito([]), [])

  const totalItems = carrito.reduce((acc, i) => acc + i.cantidad, 0)

  return (
    <CarritoContext.Provider value={{
      carrito,
      drawerAbierto,
      setDrawerAbierto,
      agregarAlCarrito,
      cambiarCantidad,
      eliminarItem,
      limpiarCarrito,
      totalItems,
    }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const ctx = useContext(CarritoContext)
  if (!ctx) throw new Error('useCarrito debe usarse dentro de CarritoProvider')
  return ctx
}
