export interface TransportRecord {
  id: string
  orderNo: string
  customerInfo: string
  origin: string
  destination: string
  containerNo: string
  vehicleId: string
  vehiclePlateNo?: string
  driverId: string
  driverName?: string
  importedAt: string
  containerStatus?: 'heavy' | 'empty' | null
}

export interface TransportRecordListParams {
  startDate?: string
  endDate?: string
  vehicleId?: string
  driverId?: string
  page?: number
  pageSize?: number
}

export interface TransportRecordStatistics {
  byDriver: Array<{ driverId: string; driverName: string; count: number }>
  byVehicle: Array<{ vehicleId: string; vehiclePlateNo: string; count: number }>
}

export interface ImportResult {
  totalRows: number
  successCount: number
  duplicateCount: number
  errorCount: number
  errors?: Array<{ row: number; message: string }>
}