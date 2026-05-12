import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { nextTick } from 'vue'

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...(actual as object),
    ElMessageBox: {
      confirm: vi.fn().mockResolvedValue('confirm'),
    },
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  }
})

const mockUpdateVehicle = vi.fn()
const mockBindDriverToVehicle = vi.fn()
const mockFetchDrivers = vi.fn()

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => ({
    drivers: [
      {
        id: 'd1',
        name: '张三',
        phone: '13800138000',
        boundVehicleId: null,
        boundVehiclePlateNo: undefined,
        isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'd2',
        name: '李四',
        phone: '13900139000',
        boundVehicleId: 'v2',
        boundVehiclePlateNo: '粤B67890',
        isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    driverLoading: false,
    updateVehicle: (...args: unknown[]) => mockUpdateVehicle(...args),
    bindDriverToVehicle: (...args: unknown[]) => mockBindDriverToVehicle(...args),
    fetchDrivers: (...args: unknown[]) => mockFetchDrivers(...args),
  }),
}))

import VehicleFormDialog from '../components/VehicleFormDialog.vue'
import { Ownership } from '../types/vehicle'

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(VehicleFormDialog, {
    props: {
      visible: true,
      vehicle: null,
      ...props,
    },
    global: {
      plugins: [ElementPlus],
    },
  })
}

async function setupSubmitWrapper(vehicleOverrides: Record<string, unknown> = {}) {
  const wrapper = createWrapper({
    vehicle: {
      id: 'v1',
      plateNo: '粤A12345',
      ownership: Ownership.OWN,
      boundDriverId: null,
      boundDriverName: undefined,
      status: 'idle',
      isDisabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      ...vehicleOverrides,
    },
  })

  await nextTick()

  const formEl = wrapper.findComponent({ name: 'ElForm' })
  if (formEl.exists()) {
    wrapper.vm.formRef = {
      validate: vi.fn().mockResolvedValue(true),
      clearValidate: vi.fn(),
    }
  }

  return wrapper
}

describe('VehicleFormDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('driver binding dropdown', () => {
    it('renders driver select dropdown when editing vehicle', () => {
      const wrapper = createWrapper({
        vehicle: {
          id: 'v1',
          plateNo: '粤A12345',
          ownership: Ownership.OWN,
          boundDriverId: null,
          boundDriverName: undefined,
          status: 'idle',
          isDisabled: false,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      })
      expect(wrapper.vm.form).toHaveProperty('boundDriverId')
    })

    it('loads drivers on mount when visible', () => {
      createWrapper()
      expect(mockFetchDrivers).toHaveBeenCalled()
    })

    it('pre-selects bound driver when editing vehicle with driver', () => {
      const wrapper = createWrapper({
        vehicle: {
          id: 'v1',
          plateNo: '粤A12345',
          ownership: Ownership.OWN,
          boundDriverId: 'd1',
          boundDriverName: '张三',
          status: 'idle',
          isDisabled: false,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      })

      expect(wrapper.vm.form.boundDriverId).toBe('d1')
    })

    it('does not pre-select driver when vehicle has no bound driver', () => {
      const wrapper = createWrapper({
        vehicle: {
          id: 'v1',
          plateNo: '粤A12345',
          ownership: Ownership.OWN,
          boundDriverId: null,
          boundDriverName: undefined,
          status: 'idle',
          isDisabled: false,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      })

      expect(wrapper.vm.form.boundDriverId).toBeNull()
    })
  })

  describe('bind driver on submit', () => {
    it('calls bindDriverToVehicle when driver is selected for new binding', async () => {
      mockBindDriverToVehicle.mockResolvedValue({
        needConfirm: false,
        message: '司机绑定成功',
      })
      mockUpdateVehicle.mockResolvedValue({
        id: 'v1',
        plateNo: '粤A12345',
        ownership: Ownership.OWN,
        boundDriverId: 'd1',
        boundDriverName: '张三',
        status: 'idle',
        isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      })

      const wrapper = await setupSubmitWrapper()

      wrapper.vm.form.boundDriverId = 'd1'
      await wrapper.vm.handleSubmit()

      expect(mockBindDriverToVehicle).toHaveBeenCalledWith('v1', 'd1', false)
    })

    it('calls bindDriverToVehicle with confirmed=true when driver already bound to another vehicle', async () => {
      mockBindDriverToVehicle
        .mockResolvedValueOnce({
          needConfirm: true,
          message: '该司机已关联车辆 粤B67890，是否更换关联？',
          oldVehicleId: 'v2',
          oldVehiclePlateNo: '粤B67890',
        })
        .mockResolvedValueOnce({
          needConfirm: false,
          message: '司机绑定成功',
        })
      mockUpdateVehicle.mockResolvedValue({
        id: 'v1',
        plateNo: '粤A12345',
        ownership: Ownership.OWN,
        boundDriverId: 'd2',
        boundDriverName: '李四',
        status: 'idle',
        isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      })

      const wrapper = await setupSubmitWrapper()

      wrapper.vm.form.boundDriverId = 'd2'
      await wrapper.vm.handleSubmit()

      expect(mockBindDriverToVehicle).toHaveBeenCalledTimes(2)
      expect(mockBindDriverToVehicle).toHaveBeenNthCalledWith(1, 'v1', 'd2', false)
      expect(mockBindDriverToVehicle).toHaveBeenNthCalledWith(2, 'v1', 'd2', true)
    })

    it('does not call bindDriverToVehicle when driver is unchanged', async () => {
      mockUpdateVehicle.mockResolvedValue({
        id: 'v1',
        plateNo: '粤A12345',
        ownership: Ownership.OWN,
        boundDriverId: 'd1',
        boundDriverName: '张三',
        status: 'idle',
        isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      })

      const wrapper = await setupSubmitWrapper({
        boundDriverId: 'd1',
        boundDriverName: '张三',
      })

      wrapper.vm.form.boundDriverId = 'd1'
      await wrapper.vm.handleSubmit()

      expect(mockBindDriverToVehicle).not.toHaveBeenCalled()
      expect(mockUpdateVehicle).toHaveBeenCalledWith('v1', { ownership: Ownership.OWN })
    })

    it('clears driver binding when driver is deselected', async () => {
      mockBindDriverToVehicle.mockResolvedValue({
        needConfirm: false,
        message: '司机绑定成功',
      })
      mockUpdateVehicle.mockResolvedValue({
        id: 'v1',
        plateNo: '粤A12345',
        ownership: Ownership.OWN,
        boundDriverId: null,
        boundDriverName: undefined,
        status: 'idle',
        isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      })

      const wrapper = await setupSubmitWrapper({
        boundDriverId: 'd1',
        boundDriverName: '张三',
      })

      wrapper.vm.form.boundDriverId = ''
      await wrapper.vm.handleSubmit()

      expect(mockBindDriverToVehicle).toHaveBeenCalledWith('v1', '', false)
    })
  })
})