import { ref, type Ref } from 'vue'
import { fleetService } from '../services/fleetService'
import type { Driver, CreateDriverRequest, UpdateDriverRequest, DriverListParams } from '../types/driver'

type DriversRef = Ref<Driver[]>
type LoadingRef = Ref<boolean>
type ErrorRef = Ref<string | null>

export async function fetchDriversAction(
  drivers: DriversRef, loading: LoadingRef, error: ErrorRef, params?: DriverListParams,
) {
  loading.value = true
  error.value = null
  try {
    const result = await fleetService.getDrivers(params)
    drivers.value = result.items
  } catch (e) {
    error.value = e instanceof Error ? e.message : '获取司机列表失败'
  } finally {
    loading.value = false
  }
}

export async function createDriverAction(
  drivers: DriversRef, loading: LoadingRef, error: ErrorRef, data: CreateDriverRequest,
) {
  loading.value = true
  error.value = null
  try {
    const driver = await fleetService.createDriver(data)
    drivers.value.unshift(driver)
    return driver
  } catch (e) {
    error.value = e instanceof Error ? e.message : '新增司机失败'
    throw e
  } finally {
    loading.value = false
  }
}

export async function updateDriverAction(
  drivers: DriversRef, loading: LoadingRef, error: ErrorRef, id: string, data: UpdateDriverRequest,
) {
  loading.value = true
  error.value = null
  try {
    const driver = await fleetService.updateDriver(id, data)
    const index = drivers.value.findIndex((d) => d.id === id)
    if (index !== -1) {
      drivers.value[index] = driver
    }
    return driver
  } catch (e) {
    error.value = e instanceof Error ? e.message : '编辑司机失败'
    throw e
  } finally {
    loading.value = false
  }
}

export async function disableDriverAction(
  drivers: DriversRef, loading: LoadingRef, error: ErrorRef, id: string,
) {
  loading.value = true
  error.value = null
  try {
    await fleetService.disableDriver(id)
    const driver = drivers.value.find((d) => d.id === id)
    if (driver) {
      driver.isDisabled = true
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '停用司机失败'
    throw e
  } finally {
    loading.value = false
  }
}

export async function deleteDriverAction(
  drivers: DriversRef, loading: LoadingRef, error: ErrorRef, id: string,
) {
  loading.value = true
  error.value = null
  try {
    await fleetService.deleteDriver(id)
    drivers.value = drivers.value.filter((d) => d.id !== id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '删除司机失败'
    throw e
  } finally {
    loading.value = false
  }
}

export function useFleetDrivers() {
  const drivers = ref<Driver[]>([])
  const driverLoading = ref(false)
  const driverError = ref<string | null>(null)

  function fetchDrivers(params?: DriverListParams) {
    return fetchDriversAction(drivers, driverLoading, driverError, params)
  }
  function createDriver(data: CreateDriverRequest) {
    return createDriverAction(drivers, driverLoading, driverError, data)
  }
  function updateDriver(id: string, data: UpdateDriverRequest) {
    return updateDriverAction(drivers, driverLoading, driverError, id, data)
  }
  function disableDriver(id: string) {
    return disableDriverAction(drivers, driverLoading, driverError, id)
  }
  function deleteDriver(id: string) {
    return deleteDriverAction(drivers, driverLoading, driverError, id)
  }

  function resetDrivers() {
    drivers.value = []
    driverLoading.value = false
    driverError.value = null
  }

  return {
    drivers, driverLoading, driverError,
    fetchDrivers, createDriver, updateDriver, disableDriver, deleteDriver,
    resetDrivers,
  }
}