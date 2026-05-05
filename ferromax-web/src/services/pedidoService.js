import api from './api'

const pedidoService = {
  async crear(items, medioPago = 'EFECTIVO') {
    const payload = {
      medioPago,
      clienteId: null,
      items: items.map((i) => ({
        productoId: Number(i.producto.id),
        cantidad: Number(i.cantidad),
      })),
    }
    const { data } = await api.post('/ventas', payload)
    return data
  },

  async listarMios() {
    const { data } = await api.get('/pedidos/mis-pedidos')
    return data
  },
}

export default pedidoService
