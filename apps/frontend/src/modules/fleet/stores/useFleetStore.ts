import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fleetService } from '../services/fleetService'
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest, VehicleListParams } from '../types/vehicle'
import { VehicleStatus } from '../types/vehicle'
import type { Driver, CreateDriverRequest, UpdateDriverRequest, DriverListParams } from '../types/driver'

export const useFleetStore = defineStore('fleet', () => {
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

  async function fetchVehicles(params?: VehicleListParams) {
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

  async function createVehicle(data: CreateVehicleRequest) {
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

  async function updateVehicle(id: string, data: UpdateVehicleRequest) {
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

  async function disableVehicle(id: string) {
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

  const drivers = ref<Driver[]>([])
  const driverLoading = ref(false)
  const driverError = ref<string | null>(null)

  async function fetchDrivers(params?: DriverListParams) {
    driverLoading.value = true
    driverError.value = null
    try {
      const result = await fleetService.getDrivers(params)
      drivers.value = result.items
    } catch (e) {
      driverError.value = e instanceof Error ? e.message : '获取司机列表失败'
    } finally {
      driverLoading.value = false
    }
  }

  async function createDriver(data: CreateDriverRequest) {
    driverLoading.value = true
    driverError.value = null
    try {
      const driver = await fleetService.createDriver(data)
      drivers.value.unshift(driver)
      return driver
    } catch (e) {
      driverError.value = e instanceof Error ? e.message : '新增司机失败'
      throw e
    } finally {
      driverLoading.value = false
    }
  }

  async function updateDriver(id: string, data: UpdateDriverRequest) {
    driverLoading.value = true
    driverError.value = null
    try {
      const driver = await fleetService.updateDriver(id, data)
      const index = drivers.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        drivers.value[index] = driver
      }
      return driver
    } catch (e) {
      driverError.value = e instanceof Error ? e.message : '编辑司机失败'
      throw e
    } finally {
      driverLoading.value = false
    }
  }

  async function disableDriver(id: string) {
    driverLoading.value = true
    driverError.value = null
    try {
      await fleetService.disableDriver(id)
      const driver = drivers.value.find((d) => d.id === id)
      if (driver) {
        driver.isDisabled = true
      }
    } catch (e) {
      driverError.value = e instanceof Error ? e.message : '停用司机失败'
      throw e
    } finally {
      driverLoading.value = false
    }
  }

  async function deleteDriver(id: string) {
    driverLoading.value = true
    driverError.value = null
    try {
      await fleetService.deleteDriver(id)
      drivers.value = drivers.value.filter((d) => d.id !== id)
    } catch (e) {
      driverError.value = e instanceof Error ? e.message : '删除司机失败'
      throw e
    } finally {
      driverLoading.value = false
    }
  }

  function resetState() {
    vehicles.value = []
    vehicleLoading.value = false
    vehicleError.value = null
    drivers.value = []
    driverLoading.value = false
    driverError.value = null
  }

  return {
    vehicles,
    vehicleLoading,
    vehicleError,
    idleVehicles,
    transitingVehicles,
    overdueVehicles,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    disableVehicle,
    drivers,
    driverLoading,
    driverError,
    fetchDrivers,
    createDriver,
    updateDriver,
    disableDriver,
    deleteDriver,
    resetState,
  }
})