export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  TIMEOUT = 'timeout',
}

export enum VehicleStatus {
  IDLE = 'idle',
  IN_TRANSIT = 'in_transit',
  TIMEOUT = 'timeout',
}

export enum UserRole {
  DISPATCHER = 'dispatcher',
  DRIVER = 'driver',
  ADMIN = 'admin',
}
