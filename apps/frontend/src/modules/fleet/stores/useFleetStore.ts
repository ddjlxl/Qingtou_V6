import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fleetService } from '../services/fleetService'
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest, VehicleListParams } from '../types/vehicle'
import { VehicleStatus } from '../types/vehicle'
import type { Driver, CreateDriverRequest, UpdateDriverRequest, DriverListParams } from '../types/driver'
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

  async function bindDriverToVehicle(
    vehicleId: string,
    driverId: string,
    confirmed: boolean
  ) {
    vehicleLoading.value = true
    vehicleError.value = null
    try {
      const result = await fleetService.bindDriverToVehicle(vehicleId, {
        driverId,
        confirmed,
      })
      return result
    } catch (e) {
      vehicleError.value = e instanceof Error ? e.message : '绑定司机失败'
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

  const certificates = ref<Certificate[]>([])
  const certificateLoading = ref(false)
  const certificateError = ref<string | null>(null)

  async function fetchCertificates(params?: CertificateListParams) {
    certificateLoading.value = true
    certificateError.value = null
    try {
      const result = await fleetService.getCertificates(params)
      certificates.value = result.items
      return result
    } catch (e) {
      certificateError.value = e instanceof Error ? e.message : '获取证照列表失败'
    } finally {
      certificateLoading.value = false
    }
  }

  async function createCertificate(data: CreateCertificateRequest) {
    certificateLoading.value = true
    certificateError.value = null
    try {
      const cert = await fleetService.createCertificate(data)
      certificates.value.unshift(cert)
      return cert
    } catch (e) {
      certificateError.value = e instanceof Error ? e.message : '新增证照失败'
      throw e
    } finally {
      certificateLoading.value = false
    }
  }

  async function updateCertificate(id: string, data: UpdateCertificateRequest) {
    certificateLoading.value = true
    certificateError.value = null
    try {
      const cert = await fleetService.updateCertificate(id, data)
      const index = certificates.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        certificates.value[index] = cert
      }
      return cert
    } catch (e) {
      certificateError.value = e instanceof Error ? e.message : '编辑证照失败'
      throw e
    } finally {
      certificateLoading.value = false
    }
  }

  async function deleteCertificate(id: string) {
    certificateLoading.value = true
    certificateError.value = null
    try {
      await fleetService.deleteCertificate(id)
      certificates.value = certificates.value.filter((c) => c.id !== id)
    } catch (e) {
      certificateError.value = e instanceof Error ? e.message : '删除证照失败'
      throw e
    } finally {
      certificateLoading.value = false
    }
  }

  const transportRecords = ref<TransportRecord[]>([])
  const transportRecordLoading = ref(false)
  const transportRecordError = ref<string | null>(null)
  const transportRecordTotal = ref(0)
  const transportRecordStatistics = ref<TransportRecordStatistics | null>(null)

  async function fetchTransportRecords(params?: TransportRecordListParams) {
    transportRecordLoading.value = true
    transportRecordError.value = null
    try {
      const result = await fleetService.getTransportRecords(params)
      transportRecords.value = result.items
      transportRecordTotal.value = result.total
      return result
    } catch (e) {
      transportRecordError.value = e instanceof Error ? e.message : '获取运输流水失败'
      throw e
    } finally {
      transportRecordLoading.value = false
    }
  }

  async function importTransportRecords(file: File): Promise<ImportResult> {
    transportRecordLoading.value = true
    transportRecordError.value = null
    try {
      const result = await fleetService.importTransportRecords(file)
      return result
    } catch (e) {
      transportRecordError.value = e instanceof Error ? e.message : '导入运输流水失败'
      throw e
    } finally {
      transportRecordLoading.value = false
    }
  }

  async function fetchTransportRecordStatistics() {
    transportRecordLoading.value = true
    transportRecordError.value = null
    try {
      const result = await fleetService.getTransportRecordStatistics()
      transportRecordStatistics.value = result
      return result
    } catch (e) {
      transportRecordError.value = e instanceof Error ? e.message : '获取运输统计失败'
      throw e
    } finally {
      transportRecordLoading.value = false
    }
  }

  async function downloadTransportRecordTemplate() {
    try {
      const blob = await fleetService.downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'transport_record_template.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (e) {
      transportRecordError.value = e instanceof Error ? e.message : '下载模板失败'
      throw e
    }
  }

  const statistics = ref<FleetStatistics | null>(null)
  const statisticsLoading = ref(false)
  const statisticsError = ref<string | null>(null)

  async function fetchStatistics() {
    statisticsLoading.value = true
    statisticsError.value = null
    try {
      const result = await fleetService.getStatistics()
      statistics.value = result
    } catch (e) {
      statisticsError.value = e instanceof Error ? e.message : '获取统计数据失败'
    } finally {
      statisticsLoading.value = false
    }
  }

  function resetState() {
    vehicles.value = []
    vehicleLoading.value = false
    vehicleError.value = null
    drivers.value = []
    driverLoading.value = false
    driverError.value = null
    certificates.value = []
    certificateLoading.value = false
    certificateError.value = null
    transportRecords.value = []
    transportRecordLoading.value = false
    transportRecordError.value = null
    transportRecordTotal.value = 0
    transportRecordStatistics.value = null
    statistics.value = null
    statisticsLoading.value = false
    statisticsError.value = null
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
    bindDriverToVehicle,
    drivers,
    driverLoading,
    driverError,
    fetchDrivers,
    createDriver,
    updateDriver,
    disableDriver,
    deleteDriver,
    certificates,
    certificateLoading,
    certificateError,
    fetchCertificates,
    createCertificate,
    updateCertificate,
    deleteCertificate,
    transportRecords,
    transportRecordLoading,
    transportRecordError,
    transportRecordTotal,
    transportRecordStatistics,
    fetchTransportRecords,
    importTransportRecords,
    fetchTransportRecordStatistics,
    downloadTransportRecordTemplate,
    statistics,
    statisticsLoading,
    statisticsError,
    fetchStatistics,
    resetState,
  }
})