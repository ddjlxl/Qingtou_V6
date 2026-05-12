import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => ({
    statistics: null,
    statisticsLoading: false,
    statisticsError: null,
    fetchStatistics: vi.fn(),
    vehicles: [],
    vehicleLoading: false,
    vehicleError: null,
    fetchVehicles: vi.fn(),
    drivers: [],
    driverLoading: false,
    driverError: null,
    fetchDrivers: vi.fn(),
    certificates: [],
    certificateLoading: false,
    certificateError: null,
    fetchCertificates: vi.fn(),
    transportRecords: [],
    transportRecordLoading: false,
    transportRecordError: null,
    transportRecordTotal: 0,
    fetchTransportRecords: vi.fn(),
  }),
}))

import FleetPage from '../pages/FleetPage.vue'

function createWrapper() {
  return mount(FleetPage, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        StatisticsTab: {
          template: '<div class="statistics-tab-stub">StatisticsTab</div>',
          emits: ['tab-change'],
        },
        VehicleManagement: {
          template: '<div class="vehicle-management-stub">VehicleManagement</div>',
        },
        DriverManagement: {
          template: '<div class="driver-management-stub">DriverManagement</div>',
        },
        CertificateManagement: {
          template: '<div class="certificate-management-stub">CertificateManagement</div>',
        },
        TransportRecordManagement: {
          template: '<div class="transport-record-stub">TransportRecordManagement</div>',
        },
      },
    },
  })
}

describe('FleetPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders fleet page container', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.fleet-page').exists()).toBe(true)
  })

  it('renders 5 tabs', () => {
    const wrapper = createWrapper()
    const tabs = wrapper.findAllComponents({ name: 'ElTabPane' })
    expect(tabs).toHaveLength(5)
  })

  it('renders tab labels correctly', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('统计概览')
    expect(wrapper.text()).toContain('车辆管理')
    expect(wrapper.text()).toContain('司机管理')
    expect(wrapper.text()).toContain('证照管理')
    expect(wrapper.text()).toContain('运输流水')
  })

  it('shows StatisticsTab by default', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.statistics-tab-stub').exists()).toBe(true)
  })

  it('switches to vehicle tab when activeTab changes', async () => {
    const wrapper = createWrapper()
    const tabs = wrapper.findAll('.el-tabs__item')
    await tabs[1].trigger('click')
    expect(wrapper.find('.vehicle-management-stub').exists()).toBe(true)
  })

  it('switches to certificate tab when activeTab changes', async () => {
    const wrapper = createWrapper()
    const tabs = wrapper.findAll('.el-tabs__item')
    await tabs[3].trigger('click')
    expect(wrapper.find('.certificate-management-stub').exists()).toBe(true)
  })

  it('switches to transport tab when activeTab changes', async () => {
    const wrapper = createWrapper()
    const tabs = wrapper.findAll('.el-tabs__item')
    await tabs[4].trigger('click')
    expect(wrapper.find('.transport-record-stub').exists()).toBe(true)
  })
})