import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import DashboardPage from '../pages/DashboardPage.vue'
import type { DashboardData, VehicleLocation, VehicleDashboardStatus, StatusCounts } from '../types'

const mockFetchDashboard = vi.fn()
let mockStoreData: DashboardData | null = null
let mockStoreLoading = false
let mockStoreError: string | null = null

vi.mock('../stores/useDashboardStore', () => ({
  useDashboardStore: () => ({
    get data() { return mockStoreData },
    get loading() { return mockStoreLoading },
    get error() { return mockStoreError },
    fetchDashboard: mockFetchDashboard,
  }),
}))

const MapAreaStub = defineComponent({
  name: 'MapArea',
  props: ['vehicles', 'selectedVehicleId'],
  emits: ['select-vehicle'],
  setup() {
    return () => h('div', { class: 'map-area-stub' })
  },
})

const FleetPanelStub = defineComponent({
  name: 'FleetPanel',
  props: ['vehicles', 'statusCounts', 'selectedVehicleId'],
  emits: ['select-vehicle'],
  setup() {
    return () => h('div', { class: 'fleet-panel-stub' })
  },
})

function makeVehicle(overrides: Partial<VehicleLocation> = {}): VehicleLocation {
  return {
    id: 'v1',
    plateNo: '沪A12345',
    status: 'idle' as VehicleDashboardStatus,
    lat: 31.23,
    lng: 121.47,
    location: '上海港',
    driverName: '张三',
    driverPhone: '13800138000',
    ...overrides,
  }
}

function makeStatusCounts(): StatusCounts {
  return { pending: 5, assigned: 3, transiting: 8, completed: 123, overdue: 1 }
}

function makeDashboardData(): DashboardData {
  return {
    stats: {
      todayTaskCount: 12,
      completionRate: 0.85,
      overdueCount: 2,
      avgTransportMinutes: 32,
    },
    statusCounts: makeStatusCounts(),
    vehicles: [
      makeVehicle({ id: 'v1', plateNo: '沪A12345', driverName: '张三', status: 'idle' }),
      makeVehicle({ id: 'v2', plateNo: '沪B67890', driverName: '李四', status: 'transiting' }),
    ],
  }
}

function createWrapper() {
  return mount(DashboardPage, {
    global: {
      stubs: {
        LoadingSpinner: {
          template: '<div class="loading-spinner-stub" />',
          props: ['fullscreen', 'text'],
        },
        StatisticsOverlay: {
          template: '<div class="statistics-overlay-stub" />',
          props: ['stats'],
        },
        MapArea: MapAreaStub,
        FleetPanel: FleetPanelStub,
        'el-result': {
          template: '<div class="el-result"><slot name="extra" /></div>',
          props: ['icon', 'title', 'sub-title'],
        },
        'el-button': {
          template: '<button class="el-button" :loading="loading" @click="$emit(\'click\')"><slot /></button>',
          props: ['type', 'loading'],
          emits: ['click'],
        },
        'el-icon': {
          template: '<span class="el-icon"><slot /></span>',
        },
        Refresh: {
          template: '<span class="refresh-icon" />',
        },
      },
    },
  })
}

describe('DashboardPage 双向联动', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStoreData = null
    mockStoreLoading = false
    mockStoreError = null
  })

  describe('selectedVehicleId 状态管理', () => {
    it('初始 selectedVehicleId 为 null', () => {
      mockStoreData = makeDashboardData()
      const wrapper = createWrapper()

      expect((wrapper.vm as unknown as { selectedVehicleId: string | null }).selectedVehicleId).toBeNull()
    })
  })

  describe('MapArea → FleetPanel 联动', () => {
    it('MapArea emit select-vehicle → selectedVehicleId 更新 → FleetPanel 接收', async () => {
      mockStoreData = makeDashboardData()
      const wrapper = createWrapper()

      const mapArea = wrapper.findComponent(MapAreaStub)
      await mapArea.vm.$emit('select-vehicle', 'v1')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as unknown as { selectedVehicleId: string | null }).selectedVehicleId).toBe('v1')

      const fleetPanel = wrapper.findComponent(FleetPanelStub)
      expect(fleetPanel.props('selectedVehicleId')).toBe('v1')
    })
  })

  describe('FleetPanel → MapArea 联动', () => {
    it('FleetPanel emit select-vehicle → selectedVehicleId 更新 → MapArea 接收', async () => {
      mockStoreData = makeDashboardData()
      const wrapper = createWrapper()

      const fleetPanel = wrapper.findComponent(FleetPanelStub)
      await fleetPanel.vm.$emit('select-vehicle', 'v2')
      await wrapper.vm.$nextTick()

      expect((wrapper.vm as unknown as { selectedVehicleId: string | null }).selectedVehicleId).toBe('v2')

      const mapArea = wrapper.findComponent(MapAreaStub)
      expect(mapArea.props('selectedVehicleId')).toBe('v2')
    })
  })

  describe('数据传递', () => {
    it('FleetPanel 接收 vehicles 数据', () => {
      mockStoreData = makeDashboardData()
      const wrapper = createWrapper()

      const fleetPanel = wrapper.findComponent(FleetPanelStub)
      expect(fleetPanel.props('vehicles')).toEqual(mockStoreData!.vehicles)
    })

    it('FleetPanel 接收 statusCounts 数据', () => {
      mockStoreData = makeDashboardData()
      const wrapper = createWrapper()

      const fleetPanel = wrapper.findComponent(FleetPanelStub)
      expect(fleetPanel.props('statusCounts')).toEqual(mockStoreData!.statusCounts)
    })
  })

  describe('挂载时数据获取', () => {
    it('onMounted 时调用 fetchDashboard', () => {
      createWrapper()
      expect(mockFetchDashboard).toHaveBeenCalled()
    })
  })
})

describe('DashboardPage 自动刷新 + 手动刷新', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockStoreData = null
    mockStoreLoading = false
    mockStoreError = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('30 秒自动刷新', () => {
    it('页面挂载后 30 秒自动调用 fetchDashboard', () => {
      mockStoreData = makeDashboardData()
      createWrapper()

      const callsAfterMount = mockFetchDashboard.mock.calls.length

      vi.advanceTimersByTime(30_000)

      expect(mockFetchDashboard.mock.calls.length).toBe(callsAfterMount + 1)
    })

    it('页面挂载后 60 秒自动调用 fetchDashboard 两次', () => {
      mockStoreData = makeDashboardData()
      createWrapper()

      const callsAfterMount = mockFetchDashboard.mock.calls.length

      vi.advanceTimersByTime(60_000)

      expect(mockFetchDashboard.mock.calls.length).toBe(callsAfterMount + 2)
    })

    it('29 秒时不触发自动刷新', () => {
      mockStoreData = makeDashboardData()
      createWrapper()

      const callsAfterMount = mockFetchDashboard.mock.calls.length

      vi.advanceTimersByTime(29_000)

      expect(mockFetchDashboard.mock.calls.length).toBe(callsAfterMount)
    })
  })

  describe('页面卸载清理定时器', () => {
    it('页面卸载后定时器不再触发 fetchDashboard', () => {
      mockStoreData = makeDashboardData()
      const wrapper = createWrapper()

      const callsAfterMount = mockFetchDashboard.mock.calls.length

      wrapper.unmount()
      vi.advanceTimersByTime(60_000)

      expect(mockFetchDashboard.mock.calls.length).toBe(callsAfterMount)
    })
  })

  describe('手动刷新按钮', () => {
    it('点击刷新按钮立即调用 fetchDashboard', async () => {
      mockStoreData = makeDashboardData()
      const wrapper = createWrapper()

      const callsBeforeClick = mockFetchDashboard.mock.calls.length

      const refreshBtn = wrapper.find('.dashboard-page__refresh-btn')
      await refreshBtn.trigger('click')

      expect(mockFetchDashboard.mock.calls.length).toBe(callsBeforeClick + 1)
    })

    it('刷新按钮显示 loading 状态', async () => {
      mockStoreData = makeDashboardData()
      mockStoreLoading = true
      const wrapper = createWrapper()

      const refreshBtn = wrapper.find('.dashboard-page__refresh-btn')
      expect(refreshBtn.attributes('loading')).toBe('true')
    })

    it('刷新期间不显示全屏 LoadingSpinner', () => {
      mockStoreData = makeDashboardData()
      mockStoreLoading = true
      const wrapper = createWrapper()

      const spinner = wrapper.find('.loading-spinner-stub')
      expect(spinner.exists()).toBe(false)
    })

    it('刷新期间保持当前数据显示', () => {
      mockStoreData = makeDashboardData()
      mockStoreLoading = true
      const wrapper = createWrapper()

      const content = wrapper.find('.dashboard-page__content')
      expect(content.exists()).toBe(true)
    })
  })

  describe('手动刷新后重置定时器', () => {
    it('手动刷新后 30 秒内不会再次自动刷新', async () => {
      mockStoreData = makeDashboardData()
      const wrapper = createWrapper()

      const refreshBtn = wrapper.find('.dashboard-page__refresh-btn')
      await refreshBtn.trigger('click')
      const callsAfterManualRefresh = mockFetchDashboard.mock.calls.length

      vi.advanceTimersByTime(29_000)
      expect(mockFetchDashboard.mock.calls.length).toBe(callsAfterManualRefresh)

      vi.advanceTimersByTime(1_000)
      expect(mockFetchDashboard.mock.calls.length).toBe(callsAfterManualRefresh + 1)
    })
  })

  describe('刷新失败处理', () => {
    it('刷新失败时保持已有数据', () => {
      mockStoreData = makeDashboardData()
      mockStoreError = '获取看板数据失败'
      const wrapper = createWrapper()

      const content = wrapper.find('.dashboard-page__content')
      expect(content.exists()).toBe(true)
    })
  })
})
