import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { nextTick } from 'vue'

const mockGetRouteTemplate = vi.fn()

vi.mock('../services/dispatchService', () => ({
  dispatchService: {
    getRouteTemplate: (...args: unknown[]) => mockGetRouteTemplate(...args),
    getAvailableResources: vi.fn().mockResolvedValue({ drivers: [], vehicles: [] }),
    getAddresses: vi.fn().mockResolvedValue({ items: [] }),
  },
}))

vi.mock('../stores/useDispatchStore', () => ({
  useDispatchStore: () => ({
    availableDrivers: [],
    availableVehicles: [],
    addresses: [],
    fetchAvailableResources: vi.fn(),
    createOrder: vi.fn(),
    updateOrder: vi.fn(),
  }),
}))

import OrderFormDialog from '../components/OrderFormDialog.vue'
import { BusinessType } from '../types/order'

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(OrderFormDialog, {
    props: {
      visible: true,
      mode: 'create',
      order: null,
      ...props,
    },
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('OrderFormDialog - 业务类型选择自动填充路线', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('选择业务类型后自动填充', () => {
    it('选择重箱运输后自动填充启运地、途径点、目的地', async () => {
      mockGetRouteTemplate.mockResolvedValue({
        originName: '上海港',
        waypoints: ['苏州物流园'],
        destName: '昆山工厂',
      })

      const wrapper = createWrapper()

      wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
      await nextTick()
      await nextTick()

      expect(mockGetRouteTemplate).toHaveBeenCalledWith(BusinessType.HEAVY_TRANSPORT)
      expect(wrapper.vm.form.originName).toBe('上海港')
      expect(wrapper.vm.form.waypoints).toEqual(['苏州物流园'])
      expect(wrapper.vm.form.destName).toBe('昆山工厂')
    })

    it('选择空箱运输后自动填充启运地和目的地（无途径点）', async () => {
      mockGetRouteTemplate.mockResolvedValue({
        originName: '宁波港',
        waypoints: null,
        destName: '杭州仓库',
      })

      const wrapper = createWrapper()

      wrapper.vm.form.businessType = BusinessType.EMPTY_TRANSPORT
      await nextTick()
      await nextTick()

      expect(mockGetRouteTemplate).toHaveBeenCalledWith(BusinessType.EMPTY_TRANSPORT)
      expect(wrapper.vm.form.originName).toBe('宁波港')
      expect(wrapper.vm.form.waypoints).toEqual([])
      expect(wrapper.vm.form.destName).toBe('杭州仓库')
    })

    it('选择短驳后自动填充启运地、途径点、目的地', async () => {
      mockGetRouteTemplate.mockResolvedValue({
        originName: '太仓港',
        waypoints: ['常熟中转站'],
        destName: '张家港工厂',
      })

      const wrapper = createWrapper()

      wrapper.vm.form.businessType = BusinessType.SHORT_HAUL
      await nextTick()
      await nextTick()

      expect(mockGetRouteTemplate).toHaveBeenCalledWith(BusinessType.SHORT_HAUL)
      expect(wrapper.vm.form.originName).toBe('太仓港')
      expect(wrapper.vm.form.waypoints).toEqual(['常熟中转站'])
      expect(wrapper.vm.form.destName).toBe('张家港工厂')
    })
  })

  describe('已填写字段不被覆盖', () => {
    it('启运地已填写时不会被模板覆盖', async () => {
      mockGetRouteTemplate.mockResolvedValue({
        originName: '上海港',
        waypoints: ['苏州物流园'],
        destName: '昆山工厂',
      })

      const wrapper = createWrapper()
      wrapper.vm.form.originName = '用户自定义启运地'

      wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
      await nextTick()
      await nextTick()

      expect(wrapper.vm.form.originName).toBe('用户自定义启运地')
      expect(wrapper.vm.form.waypoints).toEqual(['苏州物流园'])
      expect(wrapper.vm.form.destName).toBe('昆山工厂')
    })

    it('目的地已填写时不会被模板覆盖', async () => {
      mockGetRouteTemplate.mockResolvedValue({
        originName: '上海港',
        waypoints: ['苏州物流园'],
        destName: '昆山工厂',
      })

      const wrapper = createWrapper()
      wrapper.vm.form.destName = '用户自定义目的地'

      wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
      await nextTick()
      await nextTick()

      expect(wrapper.vm.form.originName).toBe('上海港')
      expect(wrapper.vm.form.waypoints).toEqual(['苏州物流园'])
      expect(wrapper.vm.form.destName).toBe('用户自定义目的地')
    })

    it('途径点已填写时不会被模板覆盖', async () => {
      mockGetRouteTemplate.mockResolvedValue({
        originName: '上海港',
        waypoints: ['苏州物流园'],
        destName: '昆山工厂',
      })

      const wrapper = createWrapper()
      wrapper.vm.form.waypoints = ['用户自定义途径点']

      wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
      await nextTick()
      await nextTick()

      expect(wrapper.vm.form.originName).toBe('上海港')
      expect(wrapper.vm.form.waypoints).toEqual(['用户自定义途径点'])
      expect(wrapper.vm.form.destName).toBe('昆山工厂')
    })
  })

  describe('API 异常处理', () => {
    it('API 调用失败时表单字段保持不变', async () => {
      mockGetRouteTemplate.mockRejectedValue(new Error('网络错误'))

      const wrapper = createWrapper()

      wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
      await nextTick()
      await nextTick()

      expect(wrapper.vm.form.originName).toBe('')
      expect(wrapper.vm.form.waypoints).toEqual([])
      expect(wrapper.vm.form.destName).toBe('')
    })
  })

  describe('编辑模式下不触发自动填充', () => {
    it('编辑模式下选择业务类型不会自动填充路线', async () => {
      mockGetRouteTemplate.mockResolvedValue({
        originName: '上海港',
        waypoints: ['苏州物流园'],
        destName: '昆山工厂',
      })

      const wrapper = createWrapper({
        visible: false,
        mode: 'edit',
        order: {
          id: 'o1',
          orderNo: 'DD202605150001',
          status: 'pending',
          customerName: '测试客户',
          customerPhone: null,
          originName: '原始启运地',
          originAddress: null,
          destName: '原始目的地',
          destAddress: null,
          waypoints: [],
          containerNo: null,
          containerType: null,
          sealNo: null,
          businessType: null,
          documents: null,
          driverId: null,
          driverName: null,
          vehicleId: null,
          vehiclePlateNo: null,
          dispatcherId: 'd1',
          dispatcherName: null,
          remark: null,
          assignedAt: null,
          startedAt: null,
          completedAt: null,
          createdAt: '2026-05-15T00:00:00Z',
          updatedAt: '2026-05-15T00:00:00Z',
        },
      })

      await wrapper.setProps({ visible: true })
      await nextTick()

      wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
      await nextTick()
      await nextTick()

      expect(mockGetRouteTemplate).not.toHaveBeenCalled()
      expect(wrapper.vm.form.originName).toBe('原始启运地')
      expect(wrapper.vm.form.destName).toBe('原始目的地')
    })
  })

  describe('切换业务类型', () => {
    it('从重箱运输切换到空箱运输时已填字段保留、空字段填充', async () => {
      mockGetRouteTemplate
        .mockResolvedValueOnce({
          originName: '上海港',
          waypoints: ['苏州物流园'],
          destName: '昆山工厂',
        })
        .mockResolvedValueOnce({
          originName: '宁波港',
          waypoints: null,
          destName: '杭州仓库',
        })

      const wrapper = createWrapper()

      wrapper.vm.form.businessType = BusinessType.HEAVY_TRANSPORT
      await nextTick()
      await nextTick()

      expect(wrapper.vm.form.originName).toBe('上海港')
      expect(wrapper.vm.form.waypoints).toEqual(['苏州物流园'])
      expect(wrapper.vm.form.destName).toBe('昆山工厂')

      wrapper.vm.form.originName = ''
      wrapper.vm.form.waypoints = []
      wrapper.vm.form.destName = ''

      wrapper.vm.form.businessType = BusinessType.EMPTY_TRANSPORT
      await nextTick()
      await nextTick()

      expect(wrapper.vm.form.originName).toBe('宁波港')
      expect(wrapper.vm.form.waypoints).toEqual([])
      expect(wrapper.vm.form.destName).toBe('杭州仓库')
    })
  })
})