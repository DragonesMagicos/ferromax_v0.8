import authService from './authService'
import api from './api'

// Mock del módulo api: evita peticiones HTTP reales
jest.mock('./api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}))

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('guarda el token y el usuario en localStorage y devuelve la data', async () => {
      const mockData = { token: 'abc123', nombre: 'Juan', rol: 'admin' }
      api.post.mockResolvedValue({ data: mockData })

      const result = await authService.login('juan@test.com', '123456')

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'juan@test.com',
        password: '123456',
      })
      expect(localStorage.getItem('token')).toBe('abc123')
      expect(JSON.parse(localStorage.getItem('usuario'))).toEqual({
        nombre: 'Juan',
        rol: 'admin',
      })
      expect(result).toEqual(mockData)
    })

    it('propaga el error y no guarda nada si la petición falla', async () => {
      api.post.mockRejectedValue(new Error('credenciales inválidas'))

      await expect(
        authService.login('x@x.com', 'wrong')
      ).rejects.toThrow('credenciales inválidas')

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('usuario')).toBeNull()
    })
  })

  describe('logout', () => {
    it('elimina el token y el usuario de localStorage', () => {
      localStorage.setItem('token', 'abc')
      localStorage.setItem('usuario', JSON.stringify({ nombre: 'X' }))

      authService.logout()

      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('usuario')).toBeNull()
    })
  })

  describe('getUsuarioActual', () => {
    it('devuelve los datos del usuario autenticado', async () => {
      const mockUser = { nombre: 'Ana', rol: 'user' }
      api.get.mockResolvedValue({ data: mockUser })

      const result = await authService.getUsuarioActual()

      expect(api.get).toHaveBeenCalledWith('/auth/me')
      expect(result).toEqual(mockUser)
    })
  })

  describe('register', () => {
    it('registra un usuario y devuelve la data recibida', async () => {
      const datos = { email: 'nuevo@test.com', password: '123456' }
      const mockData = { id: 1, ...datos }
      api.post.mockResolvedValue({ data: mockData })

      const result = await authService.register(datos)

      expect(api.post).toHaveBeenCalledWith('/auth/register', datos)
      expect(result).toEqual(mockData)
    })
  })

  describe('getToken', () => {
    it('devuelve el token guardado', () => {
      localStorage.setItem('token', 'mi-token')
      expect(authService.getToken()).toBe('mi-token')
    })

    it('devuelve null si no hay token', () => {
      expect(authService.getToken()).toBeNull()
    })
  })

  describe('getUsuarioGuardado', () => {
    it('devuelve el usuario parseado si existe', () => {
      const usuario = { nombre: 'Carlos', rol: 'admin' }
      localStorage.setItem('usuario', JSON.stringify(usuario))

      expect(authService.getUsuarioGuardado()).toEqual(usuario)
    })

    it('devuelve null si no hay usuario guardado', () => {
      expect(authService.getUsuarioGuardado()).toBeNull()
    })
  })

  describe('estaAutenticado', () => {
    it('devuelve true si hay un token guardado', () => {
      localStorage.setItem('token', 'algo')
      expect(authService.estaAutenticado()).toBe(true)
    })

    it('devuelve false si no hay token', () => {
      expect(authService.estaAutenticado()).toBe(false)
    })
  })
})