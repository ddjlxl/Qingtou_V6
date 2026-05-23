import { describe, it, expect, beforeEach, vi } from 'vitest'
import { reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { useOrderFormWatchers } from '../composables/useOrderFormWatchers'
import type { OrderFormState } from '../composables/useOrderForm'
import type { AvailableDriver, AvailableVehicle } from '../types/order'
import type { Order } from '../types/order'

function createForm(): OrderFormState {
  return reactive<OrderFormState>({
    customerName: '',
    customerPhone: '',
    originName: '',
    destName: '',
    waypoints: [],
    containerNo: '',
    containerType: '',
    sealNo: '',
    businessType: '',
    containerStatus: '',
    documents: [],
    driverId: '',
    vehicleId: '',
    remark: '',
  })
}

function createOptions(overrides: { mode?: 'create' | 'edit'; visible?: boolean } = {}) {
  return {
    mode: ref(overrides.mode ?? 'create') as Ref<'create' | 'edit'>,
    order: ref(null) as Ref<Order | null | undefined>,
    visible: ref(overrides.visible ?? false),
  }
}

describe('useOrderFormWatchers - 司机车辆联动', () => {
  let form: OrderFormState
  let availableDrivers: AvailableDriver[]
  let availableVehicles: AvailableVehicle[]
  let fetchResources: () => Promise<void>

  beforeEach(() => {
    form = createForm()
    availableDrivers = [
      { id: 'd1', name: '张三', phone: '13800138001', boundVehiclePlateNo: '沪A12345' },
      { id: 'd2', name: '李四', phone: '13800138002', boundVehiclePlateNo: '沪B67890' },
    ]
    availableVehicles = [
      { id: 'v1', plateNo: '沪A12345', boundDriverName: '张三' },
      { id: 'v2', plateNo: '沪B67890', boundDriverName: '李四' },
    ]
    fetchResources = vi.fn(() => Promise.resolve())
  })

  function setupWatchers(overrides: { drivers?: AvailableDriver[]; vehicles?: AvailableVehicle[]; mode?: 'create' | 'edit' } = {}) {
    const drivers = overrides.drivers ?? availableDrivers
    const vehicles = overrides.vehicles ?? availableVehicles
    useOrderFormWatchers(
      form,
      createOptions({ mode: overrides.mode }),
      () => drivers,
      () => vehicles,
      fetchResources,
    )
  }

  describe('选择车辆联动司机', () => {
    it('选择车辆后自动填入绑定的司机', () => {
      setupWatchers({ vehicles: [{ id: 'v1', plateNo: '沪A12345', boundDriverName: '张三' }] })
      form.vehicleId = 'v1'
      expect(form.driverId).toBe('d1')
    })

    it('车辆未绑定司机时不清空已有司机', () => {
      setupWatchers({ vehicles: [{ id: 'v1', plateNo: '沪A12345', boundDriverName: null }] })
      form.driverId = 'd1'
      form.vehicleId = 'v1'
      expect(form.driverId).toBe('d1')
    })

    it('清空车辆时同步清空司机以支持重新选择', () => {
      setupWatchers()
      form.vehicleId = 'v1'
      expect(form.driverId).toBe('d1')
      form.vehicleId = ''
      expect(form.driverId).toBe('')
    })
  })

  describe('选择司机联动车辆', () => {
    it('选择司机后自动填入绑定的车辆', () => {
      setupWatchers()
      form.driverId = 'd1'
      expect(form.vehicleId).toBe('v1')
    })

    it('司机未绑定车辆时不清空已有车辆', () => {
      setupWatchers({ drivers: [{ id: 'd1', name: '张三', phone: '13800138001', boundVehiclePlateNo: null }] })
      form.vehicleId = 'v1'
      form.driverId = 'd1'
      expect(form.vehicleId).toBe('v1')
    })

    it('清空司机时同步清空车辆以支持重新选择', () => {
      setupWatchers()
      form.driverId = 'd1'
      expect(form.vehicleId).toBe('v1')
      form.driverId = ''
      expect(form.vehicleId).toBe('')
    })
  })

  describe('清空后重新选择仍可联动', () => {
    it('清空司机后重新选择车辆 → 司机重新联动填入', () => {
      setupWatchers()
      form.vehicleId = 'v1'
      expect(form.driverId).toBe('d1')
      form.driverId = ''
      expect(form.vehicleId).toBe('')
      form.vehicleId = 'v1'
      expect(form.driverId).toBe('d1')
    })

    it('清空车辆后重新选择司机 → 车辆重新联动填入', () => {
      setupWatchers()
      form.driverId = 'd1'
      expect(form.vehicleId).toBe('v1')
      form.vehicleId = ''
      expect(form.driverId).toBe('')
      form.driverId = 'd1'
      expect(form.vehicleId).toBe('v1')
    })
  })

  describe('双向联动防乒乓', () => {
    it('选择车辆时自动填入的司机不会触发反向联动覆盖车辆', () => {
      setupWatchers()
      form.vehicleId = 'v1'
      expect(form.vehicleId).toBe('v1')
      expect(form.driverId).toBe('d1')
    })

    it('选择司机时自动填入的车辆不会触发反向联动覆盖司机', () => {
      setupWatchers()
      form.driverId = 'd1'
      expect(form.vehicleId).toBe('v1')
      expect(form.driverId).toBe('d1')
    })
  })

  describe('手动修改后联动', () => {
    it('选择车辆填入司机后手动更改司机 → 车辆跟随变化', () => {
      setupWatchers()
      form.vehicleId = 'v1'
      expect(form.driverId).toBe('d1')
      form.driverId = 'd2'
      expect(form.vehicleId).toBe('v2')
    })

    it('选择司机填入车辆后手动更改车辆 → 司机跟随变化', () => {
      setupWatchers()
      form.driverId = 'd1'
      expect(form.vehicleId).toBe('v1')
      form.vehicleId = 'v2'
      expect(form.driverId).toBe('d2')
    })
  })

  describe('编辑模式', () => {
    it('编辑模式下选择车辆不触发联动', () => {
      setupWatchers({ mode: 'edit' })
      form.vehicleId = 'v1'
      expect(form.driverId).toBe('')
    })

    it('编辑模式下选择司机不触发联动', () => {
      setupWatchers({ mode: 'edit' })
      form.driverId = 'd1'
      expect(form.vehicleId).toBe('')
    })
  })

  describe('资源异步加载后联动', () => {
    it('资源加载完成后再选择司机，仍能联动填入车辆', () => {
      const driversRef = ref<AvailableDriver[]>([])
      const vehiclesRef = ref<AvailableVehicle[]>([])

      useOrderFormWatchers(form, createOptions(), () => driversRef.value, () => vehiclesRef.value, fetchResources)

      driversRef.value = [
        { id: 'd1', name: '张三', phone: '13800138001', boundVehiclePlateNo: '沪A12345' },
      ]
      vehiclesRef.value = [
        { id: 'v1', plateNo: '沪A12345', boundDriverName: '张三' },
      ]

      form.driverId = 'd1'
      expect(form.vehicleId).toBe('v1')
    })

    it('资源加载完成后再选择车辆，仍能联动填入司机', () => {
      const driversRef = ref<AvailableDriver[]>([])
      const vehiclesRef = ref<AvailableVehicle[]>([])

      useOrderFormWatchers(form, createOptions(), () => driversRef.value, () => vehiclesRef.value, fetchResources)

      driversRef.value = [
        { id: 'd1', name: '张三', phone: '13800138001', boundVehiclePlateNo: '沪A12345' },
      ]
      vehiclesRef.value = [
        { id: 'v1', plateNo: '沪A12345', boundDriverName: '张三' },
      ]

      form.vehicleId = 'v1'
      expect(form.driverId).toBe('d1')
    })
  })
})
