import api from './api'

const recepcionService = {
  async recibir({ productoId, cantidad, notas }) {
    const { data } = await api.post('/recepcion', { productoId, cantidad, notas })
    return data
  },
}

export default recepcionService
