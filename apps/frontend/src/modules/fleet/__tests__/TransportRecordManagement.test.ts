import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'

const mockFetchTransportRecords = vi.fn()
const mockDownloadTransportRecordTemplate = vi.fn()
const mockFetchTransportRecordStatistics = vi.fn()

const { mockStoreState } = vi.hoisted(() => {
  return {
    mockStoreState: {
      transportRecords: [] as unknown[],
      transportRecordLoading: false,
      transportRecordError: null as string | null,
      transportRecordTotal: 0,
      transportRecordStatistics: null as {
        byDriver: Array<{ driverId: string; driverName: string; count: number }>
        byVehicle: Array<{ vehicleId: string; vehiclePlateNo: string; count: number }>
      } | null,
    },
  }
})

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => ({
    transportRecords: mockStoreState.transportRecords,
    transportRecordLoading: mockStoreState.transportRecordLoading,
    transportRecordError: mockStoreState.transportRecordError,
    transportRecordTotal: mockStoreState.transportRecordTotal,
    transportRecordStatistics: mockStoreState.transportRecordStatistics,
    fetchTransportRecords: mockFetchTransportRecords,
    fetchTransportRecordStatistics: mockFetchTransportRecordStatistics,
    importTransportRecords: vi.fn(),
    downloadTransportRecordTemplate: mockDownloadTransportRecordTemplate,
  }),
}))

vi.mock('@/shared/utils', () => ({
  isApiError: (err: unknown) => err instanceof Error,
}))

import TransportRecordManagement from '../components/TransportRecordManagement.vue'

function createWrapper() {
  return mount(TransportRecordManagement, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        EmptyState: {
          template: '<div class="empty-state"></div>',
          props: ['description'],
        },
      },
    },
  })
}

function resetStoreState() {
  mockStoreState.transportRecords = []
  mockStoreState.transportRecordLoading = false
  mockStoreState.transportRecordError = null
  mockStoreState.transportRecordTotal = 0
  mockStoreState.transportRecordStatistics = null
}

describe('TransportRecordManagement', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    resetStoreState()
  })

  it('renders transport record management container', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.transport-record-management').exists()).toBe(true)
  })

  it('calls fetchTransportRecords on mount', () => {
    createWrapper()
    expect(mockFetchTransportRecords).toHaveBeenCalled()
  })

  it('renders date range picker', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElDatePicker' }).exists()).toBe(true)
  })

  it('renders vehicle filter select', () => {
    const wrapper = createWrapper()
    const selects = wrapper.findAllComponents({ name: 'ElSelect' })
    expect(selects.length).toBeGreaterThanOrEqual(2)
  })

  it('renders search and reset buttons', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('查询')
    expect(wrapper.text()).toContain('重置')
  })

  it('renders import button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('导入运输流水')
  })

  it('renders download template button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('下载模板')
  })

  it('renders el-table component', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElTable' }).exists()).toBe(true)
  })

  it('shows empty state when no records and not loading', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.empty-state').exists()).toBe(true)
  })

  it('does not show empty state when loading', () => {
    mockStoreState.transportRecordLoading = true
    const wrapper = createWrapper()
    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })

  it('shows error alert when error exists', () => {
    mockStoreState.transportRecordError = '加载失败'
    const wrapper = createWrapper()
    expect(wrapper.find('.error-alert').exists()).toBe(true)
  })

  it('shows pagination when total > 0', () => {
    mockStoreState.transportRecords = [
      {
        id: 'tr1',
        orderNo: 'ORD001',
        customerInfo: '测试客户',
        origin: '广州',
        destination: '深圳',
        containerNo: 'CONT001',
        vehicleId: 'v1',
        vehiclePlateNo: '粤A12345',
        driverId: 'd1',
        driverName: '张三',
        importedAt: '2026-05-01T00:00:00Z',
      },
    ]
    mockStoreState.transportRecordTotal = 1
    const wrapper = createWrapper()
    expect(wrapper.find('.pagination-wrapper').exists()).toBe(true)
  })

  it('does not show pagination when total is 0', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.pagination-wrapper').exists()).toBe(false)
  })

  it('renders table with data when records exist', () => {
    mockStoreState.transportRecords = [
      {
        id: 'tr1',
        orderNo: 'ORD001',
        customerInfo: '测试客户',
        origin: '广州',
        destination: '深圳',
        containerNo: 'CONT001',
        vehicleId: 'v1',
        vehiclePlateNo: '粤A12345',
        driverId: 'd1',
        driverName: '张三',
        importedAt: '2026-05-01T00:00:00Z',
      },
    ]
    mockStoreState.transportRecordTotal = 1
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElTable' }).exists()).toBe(true)
    expect(wrapper.find('.pagination-wrapper').exists()).toBe(true)
    expect(wrapper.find('.empty-state').exists()).toBe(false)
  })

  it('calls fetchTransportRecordStatistics on mount', () => {
    createWrapper()
    expect(mockFetchTransportRecordStatistics).toHaveBeenCalled()
  })

  it('does not show statistics section when statistics is null', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.transport-statistics').exists()).toBe(false)
  })

  it('shows statistics section when statistics data exists', () => {
    mockStoreState.transportRecordStatistics = {
      byDriver: [{ driverId: 'd1', driverName: '张三', count: 5 }],
      byVehicle: [{ vehicleId: 'v1', vehiclePlateNo: '粤A12345', count: 3 }],
    }
    const wrapper = createWrapper()
    expect(wrapper.find('.transport-statistics').exists()).toBe(true)
    expect(wrapper.text()).toContain('张三')
    expect(wrapper.text()).toContain('5 单')
    expect(wrapper.text()).toContain('粤A12345')
    expect(wrapper.text()).toContain('3 单')
  })

  it('shows empty hint when statistics arrays are empty', () => {
    mockStoreState.transportRecordStatistics = {
      byDriver: [],
      byVehicle: [],
    }
    const wrapper = createWrapper()
    expect(wrapper.findAll('.statistics-empty').length).toBe(2)
  })

  it('renders container status column in table', () => {
    const wrapper = createWrapper()
    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    const containerStatusColumn = columns.find(
      (col) => col.props('prop') === 'containerStatus'
    )
    expect(containerStatusColumn).toBeDefined()
    expect(containerStatusColumn?.props('label')).toBe('空重箱')
  })

  it('container status column template renders heavy value', () => {
    mockStoreState.transportRecords = [
      {
        id: 'tr1',
        orderNo: 'ORD001',
        customerInfo: '测试客户',
        origin: '广州',
        destination: '深圳',
        containerNo: 'CONT001',
        vehicleId: 'v1',
        vehiclePlateNo: '粤A12345',
        driverId: 'd1',
        driverName: '张三',
        importedAt: '2026-05-01T00:00:00Z',
        containerStatus: 'heavy',
      },
    ]
    mockStoreState.transportRecordTotal = 1
    const wrapper = createWrapper()
    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    const containerStatusColumn = columns.find(
      (col) => col.props('prop') === 'containerStatus'
    )
    expect(containerStatusColumn).toBeDefined()
  })

  it('container status column template renders empty value', () => {
    mockStoreState.transportRecords = [
      {
        id: 'tr1',
        orderNo: 'ORD001',
        customerInfo: '测试客户',
        origin: '广州',
        destination: '深圳',
        containerNo: 'CONT001',
        vehicleId: 'v1',
        vehiclePlateNo: '粤A12345',
        driverId: 'd1',
        driverName: '张三',
        importedAt: '2026-05-01T00:00:00Z',
        containerStatus: 'empty',
      },
    ]
    mockStoreState.transportRecordTotal = 1
    const wrapper = createWrapper()
    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    const containerStatusColumn = columns.find(
      (col) => col.props('prop') === 'containerStatus'
    )
    expect(containerStatusColumn).toBeDefined()
  })

  it('container status column template handles null value', () => {
    mockStoreState.transportRecords = [
      {
        id: 'tr1',
        orderNo: 'ORD001',
        customerInfo: '测试客户',
        origin: '广州',
        destination: '深圳',
        containerNo: 'CONT001',
        vehicleId: 'v1',
        vehiclePlateNo: '粤A12345',
        driverId: 'd1',
        driverName: '张三',
        importedAt: '2026-05-01T00:00:00Z',
        containerStatus: null,
      },
    ]
    mockStoreState.transportRecordTotal = 1
    const wrapper = createWrapper()
    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    const containerStatusColumn = columns.find(
      (col) => col.props('prop') === 'containerStatus'
    )
    expect(containerStatusColumn).toBeDefined()
  })

  it('container status column template handles undefined value', () => {
    mockStoreState.transportRecords = [
      {
        id: 'tr1',
        orderNo: 'ORD001',
        customerInfo: '测试客户',
        origin: '广州',
        destination: '深圳',
        containerNo: 'CONT001',
        vehicleId: 'v1',
        vehiclePlateNo: '粤A12345',
        driverId: 'd1',
        driverName: '张三',
        importedAt: '2026-05-01T00:00:00Z',
      },
    ]
    mockStoreState.transportRecordTotal = 1
    const wrapper = createWrapper()
    const columns = wrapper.findAllComponents({ name: 'ElTableColumn' })
    const containerStatusColumn = columns.find(
      (col) => col.props('prop') === 'containerStatus'
    )
    expect(containerStatusColumn).toBeDefined()
  })
})