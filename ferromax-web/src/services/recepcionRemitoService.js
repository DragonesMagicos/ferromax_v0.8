import api from './api'

const recepcionRemitoService = {
  async listarPendientes() {
    const { data } = await api.get('/recepciones-remito/pendientes')
    return data
  },

  async listarTodos() {
    const { data } = await api.get('/recepciones-remito')
    return data
  },

  async obtenerDetalle(id) {
    const { data } = await api.get(`/recepciones-remito/${id}`)
    return data
  },

  async confirmar(id, { aprobar, notasAdmin }) {
    const { data } = await api.patch(`/recepciones-remito/${id}/confirmar`, { aprobar, notasAdmin })
    return data
  },
}

export default recepcionRemitoService
