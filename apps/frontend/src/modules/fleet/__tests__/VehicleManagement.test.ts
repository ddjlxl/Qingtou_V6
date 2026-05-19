import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { VehicleStatus, Ownership } from '../types/vehicle'

const {
  mockFetchVehicles,
  mockDisableVehicle,
  mockDeleteVehicle,
  mockElMessageBoxConfirm,
  mockElMessageSuccess,
  mockElMessageError,
} = vi.hoisted(() => ({
  mockFetchVehicles: vi.fn(),
  mockDisableVehicle: vi.fn(),
  mockDeleteVehicle: vi.fn(),
  mockElMessageBoxConfirm: vi.fn().mockResolvedValue('confirm'),
  mockElMessageSuccess: vi.fn(),
  mockElMessageError: vi.fn(),
}))

let mockVehicles: any[] = []
let mockVehicleLoading = false

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

vi.mock('../services/fleetService', () => ({
  fleetService: {
    deleteVehicle: (...args: unknown[]) => mockDeleteVehicle(...args),
  },
}))

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => ({
    get vehicles() { return mockVehicles },
    get vehicleLoading() { return mockVehicleLoading },
    vehicleError: null,
    fetchVehicles: mockFetchVehicles,
    disableVehicle: mockDisableVehicle,
  }),
}))

import ElementPlus from 'element-plus'
import VehicleManagement from '../components/VehicleManagement.vue'

function makeVehicle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'v1',
    plateNo: '粤A12345',
    ownership: Ownership.OWN,
    boundDriverId: null,
    boundDriverName: undefined,
    status: VehicleStatus.IDLE,
    isDisabled: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function createWrapper() {
  return mount(VehicleManagement, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        StatusTag: {
          template: '<span class="status-tag">{{ status }}</span>',
          props: ['status'],
        },
        VehicleFormDialog: {
          template: '<div class="form-dialog" v-if="visible"><slot /></div>',
          props: ['visible', 'vehicle'],
          emits: ['update:visible', 'success'],
        },
      },
    },
  })
}

describe('VehicleManagement', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockVehicles = [makeVehicle()]
    mockVehicleLoading = false
    mockElMessageBoxConfirm.mockResolvedValue('confirm')
  })

  describe('rendering', () => {
    it('renders vehicle management container', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.vehicle-management').exists()).toBe(true)
    })

    it('renders status filter dropdown', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'ElSelect' }).exists()).toBe(true)
    })

    it('renders add vehicle button', () => {
      const wrapper = createWrapper()
      const addBtns = wrapper.findAll('button').filter(b => b.text().includes('新增车辆'))
      expect(addBtns.length).toBeGreaterThan(0)
    })

    it('renders el-table component', () => {
      const wrapper = createWrapper()
      expect(wrapper.findComponent({ name: 'ElTable' }).exists()).toBe(true)
    })
  })

  describe('data fetching', () => {
    it('calls fetchVehicles on mount', () => {
      createWrapper()
      expect(mockFetchVehicles).toHaveBeenCalled()
    })
  })

  describe('status filter', () => {
    it('calls fetchVehicles with status param when filter changes', async () => {
      const wrapper = createWrapper()
      const select = wrapper.findComponent({ name: 'ElSelect' })
      await select.vm.$emit('update:modelValue', VehicleStatus.IDLE)
      await select.vm.$emit('change', VehicleStatus.IDLE)
      expect(mockFetchVehicles).toHaveBeenCalledWith({ status: VehicleStatus.IDLE })
    })

    it('calls fetchVehicles without params when filter cleared', async () => {
      mockFetchVehicles.mockClear()
      const wrapper = createWrapper()
      const select = wrapper.findComponent({ name: 'ElSelect' })
      await select.vm.$emit('update:modelValue', '')
      await select.vm.$emit('change', '')
      expect(mockFetchVehicles).toHaveBeenCalledWith(undefined)
    })
  })

  describe('add vehicle', () => {
    it('opens dialog in add mode when clicking add button', async () => {
      const wrapper = createWrapper()
      const addBtn = wrapper.findComponent({ name: 'ElButton' })
      expect(addBtn.exists()).toBe(true)
      await addBtn.trigger('click')
      await nextTick()
      const dialog = wrapper.find('.form-dialog')
      expect(dialog.exists()).toBe(true)
    })
  })

  describe('edit vehicle', () => {
    it('opens dialog when handleEdit is called', async () => {
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      vm.handleEdit(makeVehicle({ plateNo: '粤A12345' }))
      await nextTick()
      const dialog = wrapper.find('.form-dialog')
      expect(dialog.exists()).toBe(true)
    })
  })

  describe('disable vehicle', () => {
    it('calls disableVehicle on confirm', async () => {
      mockDisableVehicle.mockResolvedValue(undefined)
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      await vm.handleDisable(makeVehicle({ id: 'v1', plateNo: '粤A12345' }))
      expect(mockElMessageBoxConfirm).toHaveBeenCalled()
      expect(mockDisableVehicle).toHaveBeenCalledWith('v1')
    })

    it('does not call disableVehicle on cancel', async () => {
      mockElMessageBoxConfirm.mockRejectedValue('cancel')
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      await vm.handleDisable(makeVehicle({ id: 'v1', plateNo: '粤A12345' }))
      expect(mockDisableVehicle).not.toHaveBeenCalled()
    })

    it('shows error message on API failure', async () => {
      mockElMessageBoxConfirm.mockResolvedValue('confirm')
      mockDisableVehicle.mockRejectedValue(new Error('停用失败'))
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      await vm.handleDisable(makeVehicle({ id: 'v1', plateNo: '粤A12345' }))
      expect(mockDisableVehicle).toHaveBeenCalledWith('v1')
      expect(mockElMessageError).toHaveBeenCalled()
    })
  })

  describe('delete vehicle', () => {
    it('calls deleteVehicle on confirm and reloads list', async () => {
      mockDeleteVehicle.mockResolvedValue(undefined)
      mockElMessageBoxConfirm.mockResolvedValue('confirm')
      mockFetchVehicles.mockClear()
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      await vm.handleDelete(makeVehicle({ id: 'v1', plateNo: '粤A12345' }))
      expect(mockDeleteVehicle).toHaveBeenCalledWith('v1')
      expect(mockFetchVehicles).toHaveBeenCalledTimes(2)
    })

    it('does not call deleteVehicle on cancel', async () => {
      mockElMessageBoxConfirm.mockRejectedValue('cancel')
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      await vm.handleDelete(makeVehicle({ id: 'v1', plateNo: '粤A12345' }))
      expect(mockDeleteVehicle).not.toHaveBeenCalled()
    })

    it('shows error message on delete failure', async () => {
      mockElMessageBoxConfirm.mockResolvedValue('confirm')
      mockDeleteVehicle.mockRejectedValue(new Error('删除失败'))
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      await vm.handleDelete(makeVehicle({ id: 'v1', plateNo: '粤A12345' }))
      expect(mockDeleteVehicle).toHaveBeenCalledWith('v1')
      expect(mockElMessageError).toHaveBeenCalled()
    })
  })

  describe('dialog success callback', () => {
    it('reloads vehicles when dialog emits success', async () => {
      mockFetchVehicles.mockClear()
      const wrapper = createWrapper()
      const vm = wrapper.vm as any
      vm.handleDialogSuccess()
      expect(mockFetchVehicles).toHaveBeenCalled()
    })
  })
})
