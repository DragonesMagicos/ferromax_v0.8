import { http, HttpResponse } from 'msw'

// Debe coincidir con VITE_API_URL configurada para el entorno de test
export const BASE_URL = 'http://localhost:3000'

export const handlers = [
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json()

    if (body.email === 'juan@test.com' && body.password === '123456') {
      return HttpResponse.json({
        token: 'token-real-123',
        nombre: 'Juan',
        rol: 'admin',
      })
    }

    return HttpResponse.json(
      { message: 'Credenciales inválidas' },
      { status: 401 }
    )
  }),

  http.get(`${BASE_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization')

    if (authHeader === 'Bearer token-real-123') {
      return HttpResponse.json({ nombre: 'Juan', rol: 'admin' })
    }

    return HttpResponse.json({ message: 'No autorizado' }, { status: 401 })
  }),

  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 1, ...body }, { status: 201 })
  }),
]