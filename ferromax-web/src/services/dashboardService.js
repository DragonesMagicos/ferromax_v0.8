import api from './api'

const dashboardService = {
  async resumen() {
    const { data } = await api.get('/dashboard/resumen')
    return data
  },

  async ventasSemana() {
    const { data } = await api.get('/dashboard/ventas-semana')
    return data
  },

  async transacciones() {
    const { data } = await api.get('/dashboard/transacciones')
    return data
  },

  async alertas() {
    const { data } = await api.get('/alertas')
    return data
  },

  async todasLasAlertas() {
    const { data } = await api.get('/alertas/todas')
    return data
  },

  async marcarAlertaLeida(id) {
    const { data } = await api.put(`/alertas/${id}/leer`)
    return data
  },

  async marcarTodasLeidas() {
    const { data } = await api.put('/alertas/leer-todas')
    return data
  },
}

export default dashboardService
