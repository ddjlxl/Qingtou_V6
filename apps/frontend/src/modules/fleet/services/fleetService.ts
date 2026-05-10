import http from '@/shared/api/client'
import type {
  Vehicle,
  VehicleListParams,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  BindDriverRequest,
  BindDriverResponse,
} from '../types/vehicle'
import type {
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
  DriverListParams,
} from '../types/driver'
import type { PaginatedResponse, VehicleAvailability } from '../types'

export const fleetService = {
  getVehicles(params?: VehicleListParams) {
    return http.get<PaginatedResponse<Vehicle>>('/v1/fleet/vehicles', { params })
  },

  getVehicle(id: string) {
    return http.get<Vehicle>(`/v1/fleet/vehicles/${id}`)
  },

  createVehicle(data: CreateVehicleRequest) {
    return http.post<Vehicle>('/v1/fleet/vehicles', data)
  },

  updateVehicle(id: string, data: UpdateVehicleRequest) {
    return http.put<Vehicle>(`/v1/fleet/vehicles/${id}`, data)
  },

  deleteVehicle(id: string) {
    return http.delete<void>(`/v1/fleet/vehicles/${id}`)
  },

  disableVehicle(id: string) {
    return http.put<void>(`/v1/fleet/vehicles/${id}/disable`)
  },

  bindDriverToVehicle(vehicleId: string, data: BindDriverRequest) {
    return http.post<BindDriverResponse>(
      `/v1/fleet/vehicles/${vehicleId}/bind-driver`,
      data
    )
  },

  checkVehicleAvailability(vehicleId: string) {
    return http.get<VehicleAvailability>(
      `/v1/fleet/vehicles/${vehicleId}/availability`
    )
  },

  getDrivers(params?: DriverListParams) {
    return http.get<PaginatedResponse<Driver>>('/v1/fleet/drivers', { params })
  },

  getDriver(id: string) {
    return http.get<Driver>(`/v1/fleet/drivers/${id}`)
  },

  createDriver(data: CreateDriverRequest) {
    return http.post<Driver>('/v1/fleet/drivers', data)
  },

  updateDriver(id: string, data: UpdateDriverRequest) {
    return http.put<Driver>(`/v1/fleet/drivers/${id}`, data)
  },

  deleteDriver(id: string) {
    return http.delete<void>(`/v1/fleet/drivers/${id}`)
  },

  disableDriver(id: string) {
    return http.put<void>(`/v1/fleet/drivers/${id}/disable`)
  },
}