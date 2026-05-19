export enum OrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  TRANSITING = 'transiting',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
}

export enum BusinessType {
  HEAVY_TRANSPORT = 'heavy_transport',
  EMPTY_TRANSPORT = 'empty_transport',
  SHORT_HAUL = 'short_haul',
}

export enum DocumentType {
  PICKUP_ORDER = 'pickup_order',
  WEIGHING = 'weighing',
  RECTIFICATION = 'rectification',
}

export enum ContainerType {
  GP20 = '20GP',
  GP40 = '40GP',
  HQ40 = '40HQ',
  HQ45 = '45HQ',
}

export enum ContainerStatus {
  HEAVY = 'heavy',
  EMPTY = 'empty',
}

export interface Order {
  id: string
  orderNo: string
  status: OrderStatus
  customerName: string | null
  customerPhone: string | null
  originName: string | null
  destName: string | null
  waypoints: string[] | null
  containerNo: string | null
  containerType: ContainerType | null
  sealNo: string | null
  businessType: BusinessType | null
  containerStatus: ContainerStatus | null
  documents: DocumentType[] | null
  driverId: string | null
  driverName: string | null
  vehicleId: string | null
  vehiclePlateNo: string | null
  dispatcherId: string
  dispatcherName: string | null
  remark: string | null
  assignedAt: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderStatusCounts {
  pending: number
  assigned: number
  transiting: number
  completed: number
  overdue: number
}

export interface OrderListResponse {
  items: Order[]
  total: number
  page: number
  pageSize: number
  statusCounts: OrderStatusCounts
}

export interface CreateOrderRequest {
  customerName?: string
  customerPhone?: string
  originName?: string
  destName?: string
  waypoints?: string[]
  containerNo?: string
  containerType?: ContainerType
  sealNo?: string
  businessType?: BusinessType
  containerStatus?: ContainerStatus
  documents?: DocumentType[]
  driverId?: string
  vehicleId?: string
  remark?: string
}

export interface UpdateOrderRequest {
  customerName?: string
  customerPhone?: string
  originName?: string
  destName?: string
  waypoints?: string[]
  containerNo?: string
  containerType?: ContainerType
  sealNo?: string
  businessType?: BusinessType
  containerStatus?: ContainerStatus
  documents?: DocumentType[]
  remark?: string
}

export interface AssignOrderRequest {
  driverId: string
  vehicleId: string
}

export interface AvailableDriver {
  id: string
  name: string
  phone: string
  boundVehiclePlateNo: string | null
}

export interface AvailableVehicle {
  id: string
  plateNo: string
  boundDriverName: string | null
}

export interface AvailableResources {
  drivers: AvailableDriver[]
  vehicles: AvailableVehicle[]
}

export interface DispatchAddress {
  id: string
  name: string
  createdAt: string
}

export interface RouteTemplate {
  businessType?: string
  originName: string
  waypoints: string[] | null
  destName: string
}

export interface OrderListParams {
  status?: OrderStatus
  keyword?: string
  page?: number
  pageSize?: number
}