import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      const enTienda = window.location.pathname.startsWith('/tienda')
      window.location.href = enTienda ? '/tienda/login' : '/admin/login'
    }
    return Promise.reject(error)
  }
)

export default api
