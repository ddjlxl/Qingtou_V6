export interface DashboardStats {
  todayTaskCount: number
  completionRate: number
  overdueCount: number
  avgTransportMinutes: number | null
}

export type VehicleDashboardStatus = 'idle' | 'transiting' | 'overdue'

export interface VehicleLocation {
  id: string
  plateNo: string
  status: VehicleDashboardStatus
  lat: number | null
  lng: number | null
  location: string | null
  driverName: string | null
  driverPhone: string | null
}

export interface StatusCounts {
  pending: number
  assigned: number
  transiting: number
  completed: number
  overdue: number
}

export interface DashboardData {
  stats: DashboardStats
  statusCounts: StatusCounts
  vehicles: VehicleLocation[]
}
