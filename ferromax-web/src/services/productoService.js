import api from './api'

const productoService = {
  // ── ADMIN ─────────────────────────────────────────────────────────────────
  async listar() {
    const { data } = await api.get('/productos')
    return data
  },

  async buscar(q, limit = 8) {
    const { data } = await api.get(`/productos/buscar?q=${encodeURIComponent(q)}&limit=${limit}`)
    return data
  },

  async buscarImagenes(q) {
    const { data } = await api.get(`/productos/imagenes?q=${encodeURIComponent(q)}`)
    return data
  },

  async buscarPorSku(sku) {
    const { data } = await api.get(`/productos/sku/${sku}`)
    return data
  },

  async buscarPorCodigoBarras(codigo) {
    const { data } = await api.get(`/productos/barcode/${encodeURIComponent(codigo)}`)
    return data
  },

  // ── EMPLEADO (sin precioCompra ni nombreProveedor) ─────────────────────────
  async listarEmpleado() {
    const { data } = await api.get('/productos/empleado')
    return data
  },

  async buscarPorSkuEmpleado(sku) {
    const { data } = await api.get(`/productos/empleado/sku/${encodeURIComponent(sku)}`)
    return data
  },

  async buscarPorCodigoBarrasEmpleado(codigo) {
    const { data } = await api.get(`/productos/empleado/barcode/${encodeURIComponent(codigo)}`)
    return data
  },

  async listarPublico() {
    const { data } = await api.get('/productos/publico')
    return data
  },

  async crear(datos) {
    const { data } = await api.post('/productos', datos)
    return data
  },

  async actualizar(id, datos) {
    const { data } = await api.put(`/productos/${id}`, datos)
    return data
  },

  async desactivar(id) {
    await api.delete(`/productos/${id}`)
  },

  async stockCritico() {
    const { data } = await api.get('/productos/stock-critico')
    return data
  },
}

export default productoService
