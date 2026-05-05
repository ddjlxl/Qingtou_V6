import axios, { type AxiosResponse, type InternalAxiosRequestConfig, type AxiosError } from 'axios'

export interface ApiError {
  code: number
  message: string
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function injectToken(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

export function handleResponseSuccess<T = unknown>(response: AxiosResponse<T>): T {
  return response.data
}

export function handleResponseError(error: AxiosError): Promise<never> {
  if (error.response?.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  const unifiedError: ApiError = {
    code: error.response?.status ?? 0,
    message: error.response?.status
      ? (error.response?.data as { message?: string })?.message ?? error.message
      : error.message || '网络异常，请检查网络连接',
  }

  return Promise.reject(unifiedError)
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

http.interceptors.request.use(injectToken)
http.interceptors.response.use(handleResponseSuccess, handleResponseError)

export default http
