import axiosClient from '../api/axiosClient'

const catalogoService = {
  async listarCategorias() {
    const { data } = await axiosClient.get('/categorias')
    return data
  },

  async listarProductos({ categoria, subcategoria, page = 0, size = 24 } = {}) {
    const params = { page, size }
    if (categoria)   params.categoria   = categoria
    if (subcategoria) params.subcategoria = subcategoria
    const { data } = await axiosClient.get('/categorias/productos', { params })
    return data
  },
}

export default catalogoService
