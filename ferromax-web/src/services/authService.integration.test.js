import { beforeAll, afterEach, afterAll, describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { BASE_URL } from '../mocks/handlers'
import authService from './authService'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})

afterAll(() => server.close())

describe('authService - pruebas de integración (red mockeada con MSW)', () => {
  it('login exitoso: guarda el token real y permite una llamada autenticada posterior', async () => {
    const data = await authService.login('juan@test.com', '123456')

    expect(data.token).toBe('token-real-123')
    expect(localStorage.getItem('token')).toBe('token-real-123')

    // Esta llamada solo funciona si el interceptor de request agregó
    // correctamente el header Authorization con el token guardado
    const usuario = await authService.getUsuarioActual()
    expect(usuario).toEqual({ nombre: 'Juan', rol: 'admin' })
  })

  it('login con credenciales inválidas: propaga el error 401 y no guarda nada', async () => {
    await expect(
      authService.login('malo@test.com', 'incorrecto')
    ).rejects.toMatchObject({
      response: { status: 401 },
    })

    expect(localStorage.getItem('token')).toBeNull()
  })

  it('interceptor de respuesta: ante un 401 limpia localStorage y redirige a /login', async () => {
    // jsdom no soporta navegación real. Reemplazamos window.location SOLO en esta
    // prueba (no en todas) y con un href inicial VÁLIDO, para no romper la
    // resolución de URLs que usa MSW internamente en el resto de las peticiones.
    const originalLocation = window.location
    delete window.location
    window.location = { href: 'http://localhost:3000/dashboard' }

    localStorage.setItem('token', 'token-vencido')
    localStorage.setItem('usuario', JSON.stringify({ nombre: 'Juan' }))

    await expect(authService.getUsuarioActual()).rejects.toBeTruthy()

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('usuario')).toBeNull()
    expect(window.location.href).toBe('/login')

    window.location = originalLocation
  })

  it('register: crea un usuario contra el endpoint simulado y devuelve la respuesta', async () => {
    const datos = { email: 'nuevo@test.com', password: '123456' }
    const result = await authService.register(datos)

    expect(result).toEqual({ id: 1, ...datos })
  })

  it('maneja un error 500 del servidor y lo propaga sin afectar localStorage', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/login`, () =>
        HttpResponse.json({ message: 'Error interno' }, { status: 500 })
      )
    )

    await expect(
      authService.login('juan@test.com', '123456')
    ).rejects.toMatchObject({ response: { status: 500 } })

    expect(localStorage.getItem('token')).toBeNull()
  })
})