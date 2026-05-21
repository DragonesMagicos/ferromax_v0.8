import api from './api'

const ventaService = {
  async registrar(ventaRequest) {
    const { data } = await api.post('/ventas', ventaRequest)
    return data
  },

  async listar(desde, hasta) {
    const params = {}
    if (desde) params.desde = desde
    if (hasta) params.hasta = hasta
    const { data } = await api.get('/ventas', { params })
    return data
  },

  async buscarPorId(id) {
    const { data } = await api.get(`/ventas/${id}`)
    return data
  },

  async anular(id) {
    const { data } = await api.put(`/ventas/${id}/anular`)
    return data
  },

  async misVentasHoy() {
    const { data } = await api.get('/ventas/mis-ventas-hoy')
    return data
  },

  async misCompras() {
    const { data } = await api.get('/ventas/mis-compras')
    return data
  },

  async detalle(id) {
    const { data } = await api.get(`/ventas/${id}/detalle`)
    return data
  },
}

export default ventaService
