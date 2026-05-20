import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { nextTick } from 'vue'

const {
  mockUpdateDriver,
  mockCreateDriver,
  mockBindDriverToVehicle,
  mockFetchVehicles,
  mockElMessageBoxConfirm,
  mockElMessageSuccess,
  mockElMessageError,
} = vi.hoisted(() => ({
  mockUpdateDriver: vi.fn(),
  mockCreateDriver: vi.fn(),
  mockBindDriverToVehicle: vi.fn(),
  mockFetchVehicles: vi.fn(),
  mockElMessageBoxConfirm: vi.fn().mockResolvedValue('confirm'),
  mockElMessageSuccess: vi.fn(),
  mockElMessageError: vi.fn(),
}))

import type { Vehicle } from '../types/vehicle'

let mockVehicles: Vehicle[] = []

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...(actual as object),
    ElMessageBox: {
      confirm: mockElMessageBoxConfirm,
    },
    ElMessage: {
      success: mockElMessageSuccess,
      error: mockElMessageError,
      warning: vi.fn(),
    },
  }
})

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => ({
    get vehicles() { return mockVehicles },
    driverLoading: false,
    vehicleLoading: false,
    updateDriver: (...args: unknown[]) => mockUpdateDriver(...args),
    createDriver: (...args: unknown[]) => mockCreateDriver(...args),
    bindDriverToVehicle: (...args: unknown[]) => mockBindDriverToVehicle(...args),
    fetchVehicles: mockFetchVehicles,
  }),
}))

import DriverFormDialog from '../components/DriverFormDialog.vue'

interface DriverFormDialogVM {
  form: {
    name: string
    phone: string
    boundVehicleId: string | null
  }
  handleSubmit: () => Promise<void>
}

function makeVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v1',
    plateNo: '粤A12345',
    ownership: 'own' as const,
    boundDriverId: null,
    boundDriverName: undefined,
    status: 'idle' as const,
    isDisabled: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(DriverFormDialog, {
    props: {
      visible: true,
      driver: null,
      ...props,
    },
    global: {
      plugins: [ElementPlus],
    },
  })
}

async function setupEditWrapper(driverOverrides: Record<string, unknown> = {}) {
  mockVehicles = [makeVehicle({ id: 'v1', plateNo: '粤A12345' })]
  const wrapper = createWrapper({
    driver: {
      id: 'd1',
      name: '张三',
      phone: '13800138000',
      boundVehicleId: null,
      boundVehiclePlateNo: undefined,
      isDisabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      ...driverOverrides,
    },
  })
  await nextTick()
  return wrapper
}

describe('DriverFormDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockVehicles = []
    mockElMessageBoxConfirm.mockResolvedValue('confirm')
  })

  describe('rendering - add mode', () => {
    it('has form fields for name and phone', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as DriverFormDialogVM
      expect(vm.form).toHaveProperty('name')
      expect(vm.form).toHaveProperty('phone')
    })

    it('does not include boundVehicleId field when adding', () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as DriverFormDialogVM
      expect(vm.form.boundVehicleId).toBeNull()
    })
  })

  describe('rendering - edit mode', () => {
    it('renders dialog title for editing', async () => {
      const wrapper = await setupEditWrapper()
      expect(wrapper.text()).toContain('编辑司机')
    })

    it('renders vehicle select dropdown when editing', async () => {
      const wrapper = await setupEditWrapper()
      const vm = wrapper.vm as unknown as DriverFormDialogVM
      expect(vm.form).toHaveProperty('boundVehicleId')
    })

    it('loads vehicles on mount when visible', () => {
      createWrapper()
      expect(mockFetchVehicles).toHaveBeenCalled()
    })

    it('pre-selects bound vehicle when editing driver with vehicle', async () => {
      const wrapper = await setupEditWrapper({
        boundVehicleId: 'v1',
        boundVehiclePlateNo: '粤A12345',
      })
      const vm = wrapper.vm as unknown as DriverFormDialogVM
      expect(vm.form.boundVehicleId).toBe('v1')
    })

    it('does not pre-select vehicle when driver has no bound vehicle', async () => {
      const wrapper = await setupEditWrapper()
      const vm = wrapper.vm as unknown as DriverFormDialogVM
      expect(vm.form.boundVehicleId).toBeNull()
    })
  })

  describe('vehicle binding on submit', () => {
    it('calls bindDriverToVehicle when a vehicle is selected', async () => {
      mockUpdateDriver.mockResolvedValue({
        id: 'd1', name: '张三', phone: '13800138000',
        boundVehicleId: null, isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      })
      mockBindDriverToVehicle.mockResolvedValue({
        needConfirm: false, message: '司机绑定成功',
      })

      const wrapper = await setupEditWrapper()
      const vm = wrapper.vm as unknown as DriverFormDialogVM
      vm.form.boundVehicleId = 'v1'
      await vm.handleSubmit()

      expect(mockBindDriverToVehicle).toHaveBeenCalledWith('v1', 'd1', false)
      expect(mockElMessageSuccess).toHaveBeenCalledWith('司机信息已更新')
    })

    it('calls bindDriverToVehicle with confirmed=true when driver already bound to another vehicle', async () => {
      mockUpdateDriver.mockResolvedValue({
        id: 'd1', name: '张三', phone: '13800138000',
        boundVehicleId: null, isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      })
      mockBindDriverToVehicle
        .mockResolvedValueOnce({
          needConfirm: true,
          message: '该车辆已关联其他司机，是否更换关联？',
          oldDriverId: 'd2',
        })
        .mockResolvedValueOnce({
          needConfirm: false, message: '司机绑定成功',
        })

      const wrapper = await setupEditWrapper()
      const vm = wrapper.vm as unknown as DriverFormDialogVM
      vm.form.boundVehicleId = 'v1'
      await vm.handleSubmit()

      expect(mockBindDriverToVehicle).toHaveBeenCalledTimes(2)
      expect(mockBindDriverToVehicle).toHaveBeenNthCalledWith(1, 'v1', 'd1', false)
      expect(mockBindDriverToVehicle).toHaveBeenNthCalledWith(2, 'v1', 'd1', true)
    })

    it('does not call bindDriverToVehicle when vehicle is unchanged', async () => {
      mockUpdateDriver.mockResolvedValue({
        id: 'd1', name: '张三', phone: '13800138000',
        boundVehicleId: 'v1', isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      })

      const wrapper = await setupEditWrapper({
        boundVehicleId: 'v1',
        boundVehiclePlateNo: '粤A12345',
      })

      const vm = wrapper.vm as unknown as DriverFormDialogVM
      vm.form.boundVehicleId = 'v1'
      await vm.handleSubmit()

      expect(mockBindDriverToVehicle).not.toHaveBeenCalled()
      expect(mockUpdateDriver).toHaveBeenCalledWith('d1', {
        name: '张三',
        phone: '13800138000',
      })
    })

    it('calls bindDriverToVehicle to unbind when vehicle is cleared', async () => {
      mockUpdateDriver.mockResolvedValue({
        id: 'd1', name: '张三', phone: '13800138000',
        boundVehicleId: null, isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
      })
      mockBindDriverToVehicle.mockResolvedValue({
        needConfirm: false, message: '解绑成功',
      })

      const wrapper = await setupEditWrapper({
        boundVehicleId: 'v1',
        boundVehiclePlateNo: '粤A12345',
      })

      const vm = wrapper.vm as unknown as DriverFormDialogVM
      vm.form.boundVehicleId = null
      await vm.handleSubmit()

      expect(mockBindDriverToVehicle).toHaveBeenCalledWith('v1', '', false)
    })
  })

  describe('form validation', () => {
    it('shows error when name is empty on submit', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as DriverFormDialogVM
      vm.form.name = ''
      vm.form.phone = '13800138000'
      await vm.handleSubmit()
      expect(mockCreateDriver).not.toHaveBeenCalled()
    })

    it('shows error when phone is invalid', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as unknown as DriverFormDialogVM
      vm.form.name = '张三'
      vm.form.phone = '123'
      await vm.handleSubmit()
      expect(mockCreateDriver).not.toHaveBeenCalled()
    })
  })
})
