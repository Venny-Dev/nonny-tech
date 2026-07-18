import apiClient from './apiClient'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
}

const authService = {
  login: (email: string, password: string) =>
    apiClient
      .post('api/auth/login', { json: { email, password } })
      .json<{ status: string; user: AuthUser }>(),

  logout: () =>
    apiClient.post('api/auth/logout').json<{ status: string }>(),

  verify: () =>
    apiClient
      .get('api/auth/verify')
      .json<{ status: string; user: AuthUser }>(),
}

export default authService
