export enum VehicleStatus {
  IDLE = 'idle',
  TRANSITING = 'transiting',
  OVERDUE = 'overdue',
}

export enum Ownership {
  OWN = 'own',
  EXTERNAL = 'external',
}

export interface Vehicle {
  id: string
  plateNo: string
  ownership: Ownership
  boundDriverId: string | null
  boundDriverName?: string
  status: VehicleStatus
  isDisabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateVehicleRequest {
  plateNo: string
  ownership: Ownership
}

export interface UpdateVehicleRequest {
  ownership?: Ownership
  boundDriverId?: string | null
}

export interface VehicleListParams {
  status?: VehicleStatus
  page?: number
  pageSize?: number
}

export interface BindDriverRequest {
  driverId: string
  confirmed: boolean
}

export interface BindDriverResponse {
  needConfirm: boolean
  message: string
  oldVehicleId?: string
  oldVehiclePlateNo?: string
}