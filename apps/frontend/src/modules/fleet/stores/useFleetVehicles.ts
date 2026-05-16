import { ref, computed, type Ref } from 'vue'
import { fleetService } from '../services/fleetService'
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest, VehicleListParams } from '../types/vehicle'
import { VehicleStatus } from '../types/vehicle'

export async function fetchVehiclesAction(
  vehicles: Ref<Vehicle[]>,
  vehicleLoading: Ref<boolean>,
  vehicleError: Ref<string | null>,
  params?: VehicleListParams,
) {
  vehicleLoading.value = true
  vehicleError.value = null
  try {
    const result = await fleetService.getVehicles(params)
    vehicles.value = result.items
  } catch (e) {
    vehicleError.value = e instanceof Error ? e.message : '获取车辆列表失败'
  } finally {
    vehicleLoading.value = false
  }
}

export async function createVehicleAction(
  vehicles: Ref<Vehicle[]>,
  vehicleLoading: Ref<boolean>,
  vehicleError: Ref<string | null>,
  data: CreateVehicleRequest,
) {
  vehicleLoading.value = true
  vehicleError.value = null
  try {
    const vehicle = await fleetService.createVehicle(data)
    vehicles.value.unshift(vehicle)
    return vehicle
  } catch (e) {
    vehicleError.value = e instanceof Error ? e.message : '新增车辆失败'
    throw e
  } finally {
    vehicleLoading.value = false
  }
}

export async function updateVehicleAction(
  vehicles: Ref<Vehicle[]>,
  vehicleLoading: Ref<boolean>,
  vehicleError: Ref<string | null>,
  id: string,
  data: UpdateVehicleRequest,
) {
  vehicleLoading.value = true
  vehicleError.value = null
  try {
    const vehicle = await fleetService.updateVehicle(id, data)
    const index = vehicles.value.findIndex((v) => v.id === id)
    if (index !== -1) {
      vehicles.value[index] = vehicle
    }
    return vehicle
  } catch (e) {
    vehicleError.value = e instanceof Error ? e.message : '编辑车辆失败'
    throw e
  } finally {
    vehicleLoading.value = false
  }
}

export async function disableVehicleAction(
  vehicles: Ref<Vehicle[]>,
  vehicleLoading: Ref<boolean>,
  vehicleError: Ref<string | null>,
  id: string,
) {
  vehicleLoading.value = true
  vehicleError.value = null
  try {
    await fleetService.disableVehicle(id)
    const vehicle = vehicles.value.find((v) => v.id === id)
    if (vehicle) {
      vehicle.isDisabled = true
    }
  } catch (e) {
    vehicleError.value = e instanceof Error ? e.message : '停用车辆失败'
    throw e
  } finally {
    vehicleLoading.value = false
  }
}

export async function bindDriverToVehicleAction(
  vehicleLoading: Ref<boolean>,
  vehicleError: Ref<string | null>,
  vehicleId: string,
  driverId: string,
  confirmed: boolean,
) {
  vehicleLoading.value = true
  vehicleError.value = null
  try {
    const result = await fleetService.bindDriverToVehicle(vehicleId, { driverId, confirmed })
    return result
  } catch (e) {
    vehicleError.value = e instanceof Error ? e.message : '绑定司机失败'
    throw e
  } finally {
    vehicleLoading.value = false
  }
}

export function useFleetVehicles() {
  const vehicles = ref<Vehicle[]>([])
  const vehicleLoading = ref(false)
  const vehicleError = ref<string | null>(null)

  const idleVehicles = computed(() =>
    vehicles.value.filter((v) => v.status === VehicleStatus.IDLE)
  )
  const transitingVehicles = computed(() =>
    vehicles.value.filter((v) => v.status === VehicleStatus.TRANSITING)
  )
  const overdueVehicles = computed(() =>
    vehicles.value.filter((v) => v.status === VehicleStatus.OVERDUE)
  )

  function fetchVehicles(params?: VehicleListParams) {
    return fetchVehiclesAction(vehicles, vehicleLoading, vehicleError, params)
  }
  function createVehicle(data: CreateVehicleRequest) {
    return createVehicleAction(vehicles, vehicleLoading, vehicleError, data)
  }
  function updateVehicle(id: string, data: UpdateVehicleRequest) {
    return updateVehicleAction(vehicles, vehicleLoading, vehicleError, id, data)
  }
  function disableVehicle(id: string) {
    return disableVehicleAction(vehicles, vehicleLoading, vehicleError, id)
  }
  function bindDriverToVehicle(vehicleId: string, driverId: string, confirmed: boolean) {
    return bindDriverToVehicleAction(vehicleLoading, vehicleError, vehicleId, driverId, confirmed)
  }

  function resetVehicles() {
    vehicles.value = []
    vehicleLoading.value = false
    vehicleError.value = null
  }

  return {
    vehicles, vehicleLoading, vehicleError,
    idleVehicles, transitingVehicles, overdueVehicles,
    fetchVehicles, createVehicle, updateVehicle, disableVehicle, bindDriverToVehicle,
    resetVehicles,
  }
}