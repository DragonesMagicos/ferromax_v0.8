import api from './api'

const TOKEN_KEY = 'token'
const USUARIO_KEY = 'usuario'

const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USUARIO_KEY, JSON.stringify({
      nombre: data.nombre,
      rol: data.rol,
    }))
    return data
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USUARIO_KEY)
  },

  async getUsuarioActual() {
    const { data } = await api.get('/auth/me')
    return data
  },

  async register(datos) {
    const { data } = await api.post('/auth/register', datos)
    return data
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  getUsuarioGuardado() {
    const raw = localStorage.getItem(USUARIO_KEY)
    return raw ? JSON.parse(raw) : null
  },

  estaAutenticado() {
    return !!localStorage.getItem(TOKEN_KEY)
  },
}

export default authService
