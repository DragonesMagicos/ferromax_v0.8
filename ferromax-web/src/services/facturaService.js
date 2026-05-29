import api from './api'

const facturaService = {
  async analizar(archivo) {
    const formData = new FormData()
    formData.append('archivo', archivo)
    const { data } = await api.post('/facturas/analizar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    return data
  },

  async confirmar({ items, notas, facturaId, proveedor, nroFactura }) {
    const { data } = await api.post('/facturas/confirmar', { items, notas, facturaId, proveedor, nroFactura })
    return data
  },

  async listar(page = 0, size = 20) {
    const { data } = await api.get(`/facturas?page=${page}&size=${size}`)
    return data
  },
}

export default facturaService
