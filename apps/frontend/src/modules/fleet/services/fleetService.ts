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
import type {
  Certificate,
  CreateCertificateRequest,
  UpdateCertificateRequest,
  CertificateListParams,
} from '../types/certificate'
import type {
  TransportRecord,
  TransportRecordListParams,
  TransportRecordStatistics,
  ImportResult,
} from '../types/transport-record'
import type { FleetStatistics } from '../types/statistics'
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

  getCertificates(params?: CertificateListParams) {
    return http.get<PaginatedResponse<Certificate>>('/v1/fleet/certificates', { params })
  },

  createCertificate(data: CreateCertificateRequest) {
    const formData = new FormData()
    formData.append('owner_id', data.ownerId)
    formData.append('owner_type', data.ownerType)
    formData.append('cert_type', data.certType)
    formData.append('cert_name', data.certName)
    formData.append('issue_date', data.issueDate)
    formData.append('expiry_date', data.expiryDate)
    if (data.attachment) {
      formData.append('attachment', data.attachment)
    }
    if (data.remark) {
      formData.append('remark', data.remark)
    }
    return http.post<Certificate>('/v1/fleet/certificates', formData)
  },

  updateCertificate(id: string, data: UpdateCertificateRequest) {
    const formData = new FormData()
    if (data.certType) formData.append('cert_type', data.certType)
    if (data.certName) formData.append('cert_name', data.certName)
    if (data.issueDate) formData.append('issue_date', data.issueDate)
    if (data.expiryDate) formData.append('expiry_date', data.expiryDate)
    if (data.attachment) formData.append('attachment', data.attachment)
    if (data.remark !== undefined && data.remark !== '') formData.append('remark', data.remark)
    return http.put<Certificate>(`/v1/fleet/certificates/${id}`, formData)
  },

  deleteCertificate(id: string) {
    return http.delete<void>(`/v1/fleet/certificates/${id}`)
  },

  getCertificateWarningCount() {
    return http.get<{ count: number }>('/v1/fleet/certificates/warning-count')
  },

  getTransportRecords(params?: TransportRecordListParams) {
    return http.get<PaginatedResponse<TransportRecord>>('/v1/fleet/transport-records', { params })
  },

  importTransportRecords(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return http.post<ImportResult>('/v1/fleet/transport-records/import', formData)
  },

  getTransportRecordStatistics() {
    return http.get<TransportRecordStatistics>('/v1/fleet/transport-records/statistics')
  },

  downloadTemplate() {
    return http.get<Blob>('/v1/fleet/transport-records/template', { responseType: 'blob' })
  },

  getStatistics() {
    return http.get<FleetStatistics>('/v1/fleet/statistics')
  },
}