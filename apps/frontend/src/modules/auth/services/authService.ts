import http from '@/shared/api/client'
import type { LoginResult, UserInfo } from '../types'

export const authService = {
  login(username: string, password: string) {
    return http.post<LoginResult>('/v1/auth/login', { username, password })
  },
  getMe() {
    return http.get<UserInfo>('/v1/auth/me')
  },
}
