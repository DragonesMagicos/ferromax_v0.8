import axios from 'axios'

const axiosClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Adjunta el JWT en cada request si existe
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ferromax_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirige al login cuando el servidor responde 401
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ferromax_token')
      const enTienda = window.location.pathname.startsWith('/tienda')
      window.location.href = enTienda ? '/tienda/login' : '/admin/login'
    }
    return Promise.reject(error)
  },
)

export default axiosClient
