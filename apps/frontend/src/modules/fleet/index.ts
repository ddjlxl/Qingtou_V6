export { default as FleetPage } from './pages/FleetPage.vue'
export { useFleetStore } from './stores/useFleetStore'
export { fleetService } from './services/fleetService'
export type {
  Vehicle,
  VehicleStatus,
  Ownership,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleListParams,
} from './types/vehicle'
export type {
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
  DriverListParams,
} from './types/driver'
export type {
  Certificate,
  CreateCertificateRequest,
  UpdateCertificateRequest,
  CertificateListParams,
  VehicleCertType,
  DriverCertType,
  OwnerType,
} from './types/certificate'
export type {
  TransportRecord,
  TransportRecordListParams,
  TransportRecordStatistics,
  ImportResult,
} from './types/transport-record'
export type { FleetStatistics } from './types/statistics'
export type { PaginatedResponse, VehicleAvailability } from './types'