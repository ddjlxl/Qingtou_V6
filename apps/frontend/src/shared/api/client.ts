import axios, { type AxiosResponse, type InternalAxiosRequestConfig, type AxiosError } from 'axios'
import camelcaseKeys from 'camelcase-keys'
import type { ApiResponse } from '@qingtou/shared-types'

declare module 'axios' {
  interface AxiosInstance {
    get<T = unknown>(url: string, config?: import('axios').AxiosRequestConfig): Promise<T>
    post<T = unknown>(url: string, data?: unknown, config?: import('axios').AxiosRequestConfig): Promise<T>
    put<T = unknown>(url: string, data?: unknown, config?: import('axios').AxiosRequestConfig): Promise<T>
    delete<T = unknown>(url: string, config?: import('axios').AxiosRequestConfig): Promise<T>
  }
}

export interface ApiError {
  code: number
  message: string
}

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function convertKeysToSnakeCase(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase)
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof FormData)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        camelToSnake(key),
        convertKeysToSnakeCase(value),
      ])
    )
  }
  return obj
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

export function convertRequestData(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  if (config.data && !(config.data instanceof FormData)) {
    config.data = convertKeysToSnakeCase(config.data)
  }
  if (config.params && !(config.params instanceof FormData)) {
    config.params = convertKeysToSnakeCase(config.params)
  }
  return config
}

export function handleResponseSuccess<T = unknown>(response: AxiosResponse<ApiResponse<T>>): T {
  if (response.config?.responseType === 'blob') {
    return response.data as T
  }

  const body = response.data as unknown as Record<string, unknown>
  if (body && typeof body === 'object' && 'data' in body && 'code' in body) {
    const data = body.data
    if (data === null || data === undefined) {
      return data as T
    }
    return camelcaseKeys(data as Record<string, unknown>, { deep: true }) as T
  }
  return camelcaseKeys(body as Record<string, unknown>, { deep: true }) as T
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

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

instance.interceptors.request.use(injectToken)
instance.interceptors.request.use(convertRequestData)
instance.interceptors.response.use(handleResponseSuccess, handleResponseError)

export default instance
