import api from './api'

const ajusteStockService = {
  async ajustar({ productoId, cantidad, motivo }) {
    const { data } = await api.post('/ajustes-stock', { productoId, cantidad, motivo })
    return data
  },

  async listar(page = 0, size = 50) {
    const { data } = await api.get('/ajustes-stock', { params: { page, size } })
    return data
  },
}

export default ajusteStockService
