import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'

const mockFetchDrivers = vi.fn()

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => ({
    drivers: [
      {
        id: 'd1',
        name: '张三',
        phone: '13800138000',
        boundVehicleId: null,
        boundVehiclePlateNo: null,
        isDisabled: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    driverLoading: false,
    driverError: null,
    fetchDrivers: mockFetchDrivers,
    disableDriver: vi.fn(),
  }),
}))

import DriverManagement from '../components/DriverManagement.vue'

function createWrapper() {
  return mount(DriverManagement, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        DriverFormDialog: {
          template: '<div class="form-dialog" v-if="visible"></div>',
          props: ['visible', 'driver'],
          emits: ['update:visible', 'success'],
        },
      },
    },
  })
}

describe('DriverManagement', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders driver management container', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.driver-management').exists()).toBe(true)
  })

  it('calls fetchDrivers on mount', () => {
    createWrapper()
    expect(mockFetchDrivers).toHaveBeenCalled()
  })

  it('renders add driver button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('新增司机')
  })

  it('renders el-table component', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElTable' }).exists()).toBe(true)
  })
})