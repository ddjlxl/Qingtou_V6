export * from './vehicle'
export * from './driver'
export * from './certificate'
export * from './transport-record'
export * from './statistics'

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