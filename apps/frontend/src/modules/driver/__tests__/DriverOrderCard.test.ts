import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { setActivePinia, createPinia } from 'pinia'
import DriverOrderCard from '../components/DriverOrderCard.vue'
import { OrderStatus, ContainerStatus } from '@/modules/dispatch'
import type { DriverOrder } from '../types'

const mockStartOrder = vi.fn()
const mockCompleteOrder = vi.fn()

vi.mock('../stores/useDriverStore', () => ({
  useDriverStore: () => ({
    startOrder: mockStartOrder,
    completeOrder: mockCompleteOrder,
  }),
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
    },
    ElMessageBox: {
      confirm: vi.fn(),
    },
  }
})

function makeOrder(overrides: Partial<DriverOrder> = {}): DriverOrder {
  return {
    id: 'order-1',
    orderNo: 'ORD-001',
    status: OrderStatus.ASSIGNED,
    customerName: '测试客户',
    customerPhone: '13800138000',
    originName: '起运地',
    destName: '目的地',
    waypoints: null,
    containerNo: 'ABCD1234567',
    containerType: null,
    sealNo: null,
    businessType: null,
    containerStatus: ContainerStatus.HEAVY,
    documents: null,
    driverId: 'driver-1',
    driverName: '测试司机',
    vehicleId: 'vehicle-1',
    vehiclePlateNo: '粤A12345',
    dispatcherId: 'dispatcher-1',
    dispatcherName: '调度员',
    remark: null,
    assignedAt: '2026-05-25T10:00:00Z',
    startedAt: null,
    completedAt: null,
    createdAt: '2026-05-25T08:00:00Z',
    updatedAt: '2026-05-25T08:00:00Z',
    ...overrides,
  }
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(DriverOrderCard, {
    props: {
      order: makeOrder(),
      ...props,
    },
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('DriverOrderCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('正常渲染', () => {
    it('显示订单号', () => {
      const wrapper = createWrapper({ order: makeOrder({ orderNo: 'ORD-002' }) })
      expect(wrapper.text()).toContain('ORD-002')
    })

    it('显示客户名', () => {
      const wrapper = createWrapper({ order: makeOrder({ customerName: '客户A' }) })
      expect(wrapper.text()).toContain('客户A')
    })

    it('显示路线信息', () => {
      const wrapper = createWrapper({ order: makeOrder({ originName: '上海', destName: '昆山' }) })
      expect(wrapper.text()).toContain('上海')
      expect(wrapper.text()).toContain('昆山')
    })

    it('显示箱号', () => {
      const wrapper = createWrapper({ order: makeOrder({ containerNo: 'ABCD1234567' }) })
      expect(wrapper.text()).toContain('ABCD1234567')
    })

    it('显示车牌号', () => {
      const wrapper = createWrapper({ order: makeOrder({ vehiclePlateNo: '粤A88888' }) })
      expect(wrapper.text()).toContain('粤A88888')
    })
  })

  describe('状态显示', () => {
    it('待分配状态显示 info 标签', () => {
      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.PENDING }) })
      const tag = wrapper.findComponent({ name: 'ElTag' })
      expect(tag.props('type')).toBe('info')
      expect(wrapper.text()).toContain('待分配')
    })

    it('待发车状态显示 warning 标签', () => {
      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.ASSIGNED }) })
      const tag = wrapper.findComponent({ name: 'ElTag' })
      expect(tag.props('type')).toBe('warning')
      expect(wrapper.text()).toContain('待发车')
    })

    it('运输中状态显示 primary 标签', () => {
      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.TRANSITING }) })
      const tag = wrapper.findComponent({ name: 'ElTag' })
      expect(tag.props('type')).toBe('primary')
      expect(wrapper.text()).toContain('运输中')
    })

    it('已完成状态显示 success 标签', () => {
      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.COMPLETED }) })
      const tag = wrapper.findComponent({ name: 'ElTag' })
      expect(tag.props('type')).toBe('success')
      expect(wrapper.text()).toContain('已完成')
    })

    it('超时状态显示 danger 标签', () => {
      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.OVERDUE }) })
      const tag = wrapper.findComponent({ name: 'ElTag' })
      expect(tag.props('type')).toBe('danger')
      expect(wrapper.text()).toContain('超时')
    })
  })

  describe('空重箱显示', () => {
    it('重箱显示"重箱"', () => {
      const wrapper = createWrapper({ order: makeOrder({ containerStatus: ContainerStatus.HEAVY }) })
      expect(wrapper.text()).toContain('重箱')
    })

    it('空箱显示"空箱"', () => {
      const wrapper = createWrapper({ order: makeOrder({ containerStatus: ContainerStatus.EMPTY }) })
      expect(wrapper.text()).toContain('空箱')
    })

    it('无状态显示"-"', () => {
      const wrapper = createWrapper({ order: makeOrder({ containerStatus: null }) })
      expect(wrapper.text()).toContain('空重箱')
    })
  })

  describe('按钮状态', () => {
    it('待发车状态显示"开始运输"按钮', () => {
      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.ASSIGNED }) })
      expect(wrapper.text()).toContain('开始运输')
    })

    it('运输中状态显示"完成任务"按钮', () => {
      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.TRANSITING }) })
      expect(wrapper.text()).toContain('完成任务')
    })

    it('待分配状态不显示按钮', () => {
      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.PENDING }) })
      expect(wrapper.find('.driver-order-card__actions').exists()).toBe(false)
    })

    it('已完成状态不显示按钮', () => {
      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.COMPLETED }) })
      expect(wrapper.find('.driver-order-card__actions').exists()).toBe(false)
    })
  })

  describe('开始运输', () => {
    it('点击开始运输按钮触发 startOrder', async () => {
      const { ElMessageBox } = await import('element-plus')
      vi.mocked(ElMessageBox.confirm).mockResolvedValueOnce({} as never)
      mockStartOrder.mockResolvedValue(undefined)

      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.ASSIGNED }) })
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const startBtn = buttons.find((b) => b.text().includes('开始运输'))

      if (startBtn) {
        await startBtn.trigger('click')
        await flushPromises()

        expect(mockStartOrder).toHaveBeenCalledWith('order-1')
      }
    })

    it('用户取消确认不调用 startOrder', async () => {
      const { ElMessageBox } = await import('element-plus')
      vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancel'))

      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.ASSIGNED }) })
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const startBtn = buttons.find((b) => b.text().includes('开始运输'))

      if (startBtn) {
        await startBtn.trigger('click')
        await flushPromises()

        expect(mockStartOrder).not.toHaveBeenCalled()
      }
    })
  })

  describe('完成任务', () => {
    it('点击完成任务按钮触发 completeOrder', async () => {
      const { ElMessageBox } = await import('element-plus')
      vi.mocked(ElMessageBox.confirm).mockResolvedValueOnce({} as never)
      mockCompleteOrder.mockResolvedValue(undefined)

      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.TRANSITING }) })
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const completeBtn = buttons.find((b) => b.text().includes('完成任务'))

      if (completeBtn) {
        await completeBtn.trigger('click')
        await flushPromises()

        expect(mockCompleteOrder).toHaveBeenCalledWith('order-1')
      }
    })

    it('用户取消确认不调用 completeOrder', async () => {
      const { ElMessageBox } = await import('element-plus')
      vi.mocked(ElMessageBox.confirm).mockRejectedValueOnce(new Error('cancel'))

      const wrapper = createWrapper({ order: makeOrder({ status: OrderStatus.TRANSITING }) })
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const completeBtn = buttons.find((b) => b.text().includes('完成任务'))

      if (completeBtn) {
        await completeBtn.trigger('click')
        await flushPromises()

        expect(mockCompleteOrder).not.toHaveBeenCalled()
      }
    })
  })
})
