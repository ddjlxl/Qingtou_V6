import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'

const mockFetchVehicles = vi.fn()

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => ({
    vehicles: [
      {
        id: 'v1',
        plateNo: '粤A12345',
        ownership: 'own',
        boundDriverId: null,
        boundDriverName: null,
        status: 'idle',
        isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    vehicleLoading: false,
    vehicleError: null,
    fetchVehicles: mockFetchVehicles,
    disableVehicle: vi.fn(),
  }),
}))

import VehicleManagement from '../components/VehicleManagement.vue'

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
          template: '<div class="form-dialog" v-if="visible"></div>',
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
  })

  it('renders vehicle management container', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.vehicle-management').exists()).toBe(true)
  })

  it('calls fetchVehicles on mount', () => {
    createWrapper()
    expect(mockFetchVehicles).toHaveBeenCalled()
  })

  it('renders status filter dropdown', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElSelect' }).exists()).toBe(true)
  })

  it('renders add vehicle button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('新增车辆')
  })

  it('renders el-table component', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElTable' }).exists()).toBe(true)
  })
})