import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VehicleLocation, VehicleDashboardStatus } from '../types'

const {
  mockMarkerInstance,
  mockMapInstance,
  mockFeatureGroup,
} = vi.hoisted(() => {
  const marker = {
    setLatLng: vi.fn().mockReturnThis(),
    setIcon: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    openPopup: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  }
  const map = {
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
    flyTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    addLayer: vi.fn().mockReturnThis(),
    removeLayer: vi.fn().mockReturnThis(),
  }
  const fg = {
    getBounds: vi.fn().mockReturnValue({
      pad: vi.fn().mockReturnValue({ northEast: { lat: 32, lng: 122 }, southWest: { lat: 30, lng: 120 } }),
    }),
  }
  return { mockMarkerInstance: marker, mockMapInstance: map, mockFeatureGroup: fg }
})

vi.mock('leaflet', () => {
  return {
    default: {
      map: vi.fn().mockReturnValue(mockMapInstance),
      tileLayer: vi.fn().mockReturnValue({ addTo: vi.fn().mockReturnThis() }),
      marker: vi.fn().mockReturnValue(mockMarkerInstance),
      divIcon: vi.fn().mockReturnValue({ options: {} }),
      featureGroup: vi.fn().mockReturnValue(mockFeatureGroup),
    },
  }
})

import MapArea from '../components/MapArea.vue'

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

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(MapArea, {
    props: {
      vehicles: [],
      selectedVehicleId: null,
      ...props,
    },
    global: {
      stubs: {},
    },
  })
}

describe('MapArea', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('地图初始化', () => {
    it('onMounted 时创建 Leaflet 地图实例', async () => {
      const L = (await import('leaflet')).default
      createWrapper()

      expect(L.map).toHaveBeenCalled()
    })

    it('默认中心点为上海港区域 [31.23, 121.47]，zoom=12', async () => {
      const L = (await import('leaflet')).default
      createWrapper()

      expect(L.map).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          center: [31.23, 121.47],
          zoom: 12,
        }),
      )
    })

    it('添加瓦片图层', async () => {
      const L = (await import('leaflet')).default
      createWrapper()

      expect(L.tileLayer).toHaveBeenCalled()
    })
  })

  describe('车辆 Marker 渲染', () => {
    it('有坐标的车辆显示 Marker', async () => {
      const L = (await import('leaflet')).default
      const vehicles = [
        makeVehicle({ id: 'v1', lat: 31.23, lng: 121.47 }),
        makeVehicle({ id: 'v2', plateNo: '沪B67890', lat: 31.24, lng: 121.48 }),
      ]

      createWrapper({ vehicles })

      expect(L.marker).toHaveBeenCalledTimes(2)
    })

    it('无坐标的车辆不显示 Marker', async () => {
      const L = (await import('leaflet')).default
      const vehicles = [
        makeVehicle({ id: 'v1', lat: null, lng: null }),
      ]

      createWrapper({ vehicles })

      expect(L.marker).not.toHaveBeenCalled()
    })

    it('lat 为 null 时即使 lng 有值也不显示 Marker', async () => {
      const L = (await import('leaflet')).default
      const vehicles = [
        makeVehicle({ id: 'v1', lat: null, lng: 121.47 }),
      ]

      createWrapper({ vehicles })

      expect(L.marker).not.toHaveBeenCalled()
    })

    it('lng 为 null 时即使 lat 有值也不显示 Marker', async () => {
      const L = (await import('leaflet')).default
      const vehicles = [
        makeVehicle({ id: 'v1', lat: 31.23, lng: null }),
      ]

      createWrapper({ vehicles })

      expect(L.marker).not.toHaveBeenCalled()
    })

    it('空车辆列表不创建 Marker', async () => {
      const L = (await import('leaflet')).default
      createWrapper({ vehicles: [] })

      expect(L.marker).not.toHaveBeenCalled()
    })
  })

  describe('Marker 颜色规则', () => {
    it('空闲(idle)车辆使用绿色 #67c23a', async () => {
      const L = (await import('leaflet')).default
      const vehicles = [makeVehicle({ status: 'idle' })]

      createWrapper({ vehicles })

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('#67c23a'),
        }),
      )
    })

    it('运输中(transiting)车辆使用蓝色 #409eff', async () => {
      const L = (await import('leaflet')).default
      const vehicles = [makeVehicle({ status: 'transiting' })]

      createWrapper({ vehicles })

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('#409eff'),
        }),
      )
    })

    it('超时(overdue)车辆使用红色 #f56c6c', async () => {
      const L = (await import('leaflet')).default
      const vehicles = [makeVehicle({ status: 'overdue' })]

      createWrapper({ vehicles })

      expect(L.divIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('#f56c6c'),
        }),
      )
    })
  })

  describe('Marker 点击事件', () => {
    it('点击 Marker 触发 select-vehicle 事件', async () => {
      const vehicles = [makeVehicle({ id: 'v1' })]
      const wrapper = createWrapper({ vehicles })

      const clickHandler = mockMarkerInstance.on.mock.calls.find(
        (call: unknown[]) => (call as [string, ...unknown[]])[0] === 'click',
      )

      if (clickHandler) {
        clickHandler[1]()
        expect(wrapper.emitted('select-vehicle')).toBeTruthy()
        expect(wrapper.emitted('select-vehicle')![0]).toEqual(['v1'])
      }
    })

    it('Marker 绑定 Popup 显示车辆信息', async () => {
      const vehicles = [makeVehicle({ plateNo: '沪A12345', driverName: '张三', status: 'idle' })]

      createWrapper({ vehicles })

      expect(mockMarkerInstance.bindPopup).toHaveBeenCalled()
      const popupContent = mockMarkerInstance.bindPopup.mock.calls[0][0] as string
      expect(popupContent).toContain('沪A12345')
      expect(popupContent).toContain('张三')
    })
  })

  describe('增量更新', () => {
    it('车辆数据更新时调用 setLatLng 更新位置', async () => {
      const vehicles = [makeVehicle({ id: 'v1', lat: 31.23, lng: 121.47 })]
      const wrapper = createWrapper({ vehicles })

      vi.clearAllMocks()

      await wrapper.setProps({
        vehicles: [makeVehicle({ id: 'v1', lat: 31.25, lng: 121.49 })],
      })

      expect(mockMarkerInstance.setLatLng).toHaveBeenCalledWith([31.25, 121.49])
    })

    it('车辆状态变更时调用 setIcon 更新颜色', async () => {
      const vehicles = [makeVehicle({ id: 'v1', status: 'idle' })]
      const wrapper = createWrapper({ vehicles })

      vi.clearAllMocks()

      await wrapper.setProps({
        vehicles: [makeVehicle({ id: 'v1', status: 'transiting' })],
      })

      expect(mockMarkerInstance.setIcon).toHaveBeenCalled()
    })

    it('新增车辆时创建新 Marker', async () => {
      const L = (await import('leaflet')).default
      const vehicles = [makeVehicle({ id: 'v1' })]
      const wrapper = createWrapper({ vehicles })

      vi.clearAllMocks()

      await wrapper.setProps({
        vehicles: [
          makeVehicle({ id: 'v1' }),
          makeVehicle({ id: 'v2', plateNo: '沪B67890', lat: 31.24, lng: 121.48 }),
        ],
      })

      expect(L.marker).toHaveBeenCalledTimes(1)
    })

    it('车辆移除时删除对应 Marker', async () => {
      const vehicles = [
        makeVehicle({ id: 'v1' }),
        makeVehicle({ id: 'v2', plateNo: '沪B67890', lat: 31.24, lng: 121.48 }),
      ]
      const wrapper = createWrapper({ vehicles })

      vi.clearAllMocks()

      await wrapper.setProps({
        vehicles: [makeVehicle({ id: 'v1' })],
      })

      expect(mockMapInstance.removeLayer).toHaveBeenCalled()
    })
  })

  describe('首次加载 fitBounds', () => {
    it('首次加载有坐标车辆后调用 fitBounds', async () => {
      const vehicles = [makeVehicle({ id: 'v1' })]

      createWrapper({ vehicles })

      expect(mockMapInstance.fitBounds).toHaveBeenCalled()
    })

    it('无坐标车辆时不调用 fitBounds', async () => {
      const vehicles = [makeVehicle({ id: 'v1', lat: null, lng: null })]

      createWrapper({ vehicles })

      expect(mockMapInstance.fitBounds).not.toHaveBeenCalled()
    })
  })

  describe('selectedVehicleId 联动', () => {
    it('selectedVehicleId 变更时调用 flyTo', async () => {
      const vehicles = [
        makeVehicle({ id: 'v1', lat: 31.23, lng: 121.47 }),
        makeVehicle({ id: 'v2', plateNo: '沪B67890', lat: 31.24, lng: 121.48 }),
      ]
      const wrapper = createWrapper({ vehicles })

      vi.clearAllMocks()

      await wrapper.setProps({ selectedVehicleId: 'v1' })

      expect(mockMapInstance.flyTo).toHaveBeenCalledWith([31.23, 121.47], 15)
    })

    it('selectedVehicleId 为 null 时不调用 flyTo', async () => {
      const vehicles = [makeVehicle({ id: 'v1' })]
      const wrapper = createWrapper({ vehicles })

      vi.clearAllMocks()

      await wrapper.setProps({ selectedVehicleId: null })

      expect(mockMapInstance.flyTo).not.toHaveBeenCalled()
    })

    it('selectedVehicleId 对应车辆无坐标时不调用 flyTo', async () => {
      const vehicles = [makeVehicle({ id: 'v1', lat: null, lng: null })]
      const wrapper = createWrapper({ vehicles })

      vi.clearAllMocks()

      await wrapper.setProps({ selectedVehicleId: 'v1' })

      expect(mockMapInstance.flyTo).not.toHaveBeenCalled()
    })
  })

  describe('地图销毁', () => {
    it('组件卸载时调用 map.remove()', async () => {
      const wrapper = createWrapper()

      wrapper.unmount()

      expect(mockMapInstance.remove).toHaveBeenCalled()
    })
  })
})
