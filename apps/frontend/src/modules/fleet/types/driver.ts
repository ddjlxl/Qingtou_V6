export interface Driver {
  id: string
  name: string
  phone: string
  boundVehicleId: string | null
  boundVehiclePlateNo?: string
  isDisabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDriverRequest {
  name: string
  phone: string
}

export interface UpdateDriverRequest {
  name?: string
  phone?: string
  boundVehicleId?: string | null
}

export interface DriverListParams {
  page?: number
  pageSize?: number
}