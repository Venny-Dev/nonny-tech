import apiClient from './apiClient'

export type UserRole = 'admin' | 'warehouse' | 'shop'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
}

const authService = {
  login: (password: string) =>
    apiClient
      .post('api/auth/login', { json: { password } })
      .json<{ status: string; user: AuthUser }>(),

  logout: () =>
    apiClient.post('api/auth/logout').json<{ status: string }>(),

  verify: () =>
    apiClient
      .get('api/auth/verify')
      .json<{ status: string; user: AuthUser }>(),
}

export default authService
