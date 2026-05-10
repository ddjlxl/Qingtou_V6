export * from './vehicle'
export * from './driver'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface VehicleAvailability {
  available: boolean
  status: string
  message: string
}