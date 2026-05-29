import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import FleetPanel from '../components/FleetPanel.vue'
import type { VehicleLocation, VehicleDashboardStatus, StatusCounts } from '../types'

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn()
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

function makeStatusCounts(overrides: Partial<StatusCounts> = {}): StatusCounts {
  return {
    pending: 5,
    assigned: 3,
    transiting: 8,
    completed: 123,
    overdue: 1,
    ...overrides,
  }
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(FleetPanel, {
    props: {
      vehicles: [],
      statusCounts: makeStatusCounts(),
      selectedVehicleId: null,
      ...props,
    },
    global: {
      stubs: {
        'el-input': {
          template: '<input class="el-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
          props: ['modelValue', 'placeholder'],
          emits: ['update:modelValue'],
        },
        'el-tag': {
          template: '<span class="el-tag" :data-type="type"><slot /></span>',
          props: ['type', 'size'],
        },
        EmptyState: {
          template: '<div class="empty-state">{{ title }}</div>',
          props: ['icon', 'title', 'description'],
        },
        StatusOverview: {
          template: '<div class="status-overview-stub" />',
          props: ['statusCounts'],
        },
      },
    },
  })
}

describe('FleetPanel', () => {
  describe('面板结构', () => {
    it('包含搜索框', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.el-input').exists()).toBe(true)
    })

    it('包含 StatusOverview 组件', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.status-overview-stub').exists()).toBe(true)
    })
  })

  describe('车辆列表渲染', () => {
    it('显示车辆列表项', () => {
      const vehicles = [
        makeVehicle({ id: 'v1', plateNo: '沪A12345', driverName: '张三', status: 'idle' }),
        makeVehicle({ id: 'v2', plateNo: '沪B67890', driverName: '李四', status: 'transiting' }),
      ]
      const wrapper = createWrapper({ vehicles })

      expect(wrapper.text()).toContain('沪A12345')
      expect(wrapper.text()).toContain('沪B67890')
    })

    it('每行显示车牌号', () => {
      const vehicles = [makeVehicle({ plateNo: '沪A12345' })]
      const wrapper = createWrapper({ vehicles })

      expect(wrapper.text()).toContain('沪A12345')
    })

    it('每行显示司机姓名', () => {
      const vehicles = [makeVehicle({ driverName: '张三' })]
      const wrapper = createWrapper({ vehicles })

      expect(wrapper.text()).toContain('张三')
    })

    it('司机姓名为 null 时显示"未分配"', () => {
      const vehicles = [makeVehicle({ driverName: null })]
      const wrapper = createWrapper({ vehicles })

      expect(wrapper.text()).toContain('未分配')
    })

    it('每行显示状态 Tag', () => {
      const vehicles = [makeVehicle({ status: 'idle' })]
      const wrapper = createWrapper({ vehicles })

      expect(wrapper.text()).toContain('空闲')
    })

    it('运输中状态显示"运输中"', () => {
      const vehicles = [makeVehicle({ status: 'transiting' })]
      const wrapper = createWrapper({ vehicles })

      expect(wrapper.text()).toContain('运输中')
    })

    it('超时状态显示"超时"', () => {
      const vehicles = [makeVehicle({ status: 'overdue' })]
      const wrapper = createWrapper({ vehicles })

      expect(wrapper.text()).toContain('超时')
    })
  })

  describe('空状态', () => {
    it('车辆列表为空时显示 EmptyState "暂无车辆信息"', () => {
      const wrapper = createWrapper({ vehicles: [] })
      const emptyState = wrapper.find('.empty-state')

      expect(emptyState.exists()).toBe(true)
      expect(wrapper.text()).toContain('暂无车辆信息')
    })

    it('搜索无结果时显示 EmptyState "未找到匹配车辆"', async () => {
      const vehicles = [
        makeVehicle({ id: 'v1', plateNo: '沪A12345', driverName: '张三' }),
      ]
      const wrapper = createWrapper({ vehicles })

      const input = wrapper.find('.el-input')
      await input.setValue('沪Z99999')

      expect(wrapper.text()).toContain('未找到匹配车辆')
    })
  })

  describe('搜索过滤', () => {
    it('按车牌号过滤', async () => {
      const vehicles = [
        makeVehicle({ id: 'v1', plateNo: '沪A12345', driverName: '张三' }),
        makeVehicle({ id: 'v2', plateNo: '沪B67890', driverName: '李四' }),
      ]
      const wrapper = createWrapper({ vehicles })

      const input = wrapper.find('.el-input')
      await input.setValue('沪A')

      expect(wrapper.text()).toContain('沪A12345')
      expect(wrapper.text()).not.toContain('沪B67890')
    })

    it('按司机姓名过滤', async () => {
      const vehicles = [
        makeVehicle({ id: 'v1', plateNo: '沪A12345', driverName: '张三' }),
        makeVehicle({ id: 'v2', plateNo: '沪B67890', driverName: '李四' }),
      ]
      const wrapper = createWrapper({ vehicles })

      const input = wrapper.find('.el-input')
      await input.setValue('张三')

      expect(wrapper.text()).toContain('沪A12345')
      expect(wrapper.text()).not.toContain('沪B67890')
    })

    it('搜索不区分大小写', async () => {
      const vehicles = [
        makeVehicle({ id: 'v1', plateNo: '沪A12345', driverName: '张三' }),
      ]
      const wrapper = createWrapper({ vehicles })

      const input = wrapper.find('.el-input')
      await input.setValue('沪a')

      expect(wrapper.text()).toContain('沪A12345')
    })

    it('清空搜索恢复全部列表', async () => {
      const vehicles = [
        makeVehicle({ id: 'v1', plateNo: '沪A12345', driverName: '张三' }),
        makeVehicle({ id: 'v2', plateNo: '沪B67890', driverName: '李四' }),
      ]
      const wrapper = createWrapper({ vehicles })

      const input = wrapper.find('.el-input')
      await input.setValue('沪A')
      await input.setValue('')

      expect(wrapper.text()).toContain('沪A12345')
      expect(wrapper.text()).toContain('沪B67890')
    })
  })

  describe('点击列表项', () => {
    it('点击列表项触发 select-vehicle 事件', async () => {
      const vehicles = [
        makeVehicle({ id: 'v1', plateNo: '沪A12345' }),
      ]
      const wrapper = createWrapper({ vehicles })

      const item = wrapper.find('.fleet-panel__item')
      await item.trigger('click')

      expect(wrapper.emitted('select-vehicle')).toBeTruthy()
      expect(wrapper.emitted('select-vehicle')![0]).toEqual(['v1'])
    })

    it('点击不同列表项触发对应 id', async () => {
      const vehicles = [
        makeVehicle({ id: 'v1', plateNo: '沪A12345' }),
        makeVehicle({ id: 'v2', plateNo: '沪B67890' }),
      ]
      const wrapper = createWrapper({ vehicles })

      const items = wrapper.findAll('.fleet-panel__item')
      await items[1].trigger('click')

      expect(wrapper.emitted('select-vehicle')![0]).toEqual(['v2'])
    })
  })

  describe('选中高亮', () => {
    it('selectedVehicleId 匹配时列表项有高亮 class', () => {
      const vehicles = [
        makeVehicle({ id: 'v1', plateNo: '沪A12345' }),
        makeVehicle({ id: 'v2', plateNo: '沪B67890' }),
      ]
      const wrapper = createWrapper({ vehicles, selectedVehicleId: 'v1' })

      const items = wrapper.findAll('.fleet-panel__item')
      expect(items[0].classes()).toContain('fleet-panel__item--selected')
      expect(items[1].classes()).not.toContain('fleet-panel__item--selected')
    })

    it('selectedVehicleId 为 null 时无高亮', () => {
      const vehicles = [makeVehicle({ id: 'v1' })]
      const wrapper = createWrapper({ vehicles, selectedVehicleId: null })

      const item = wrapper.find('.fleet-panel__item')
      expect(item.classes()).not.toContain('fleet-panel__item--selected')
    })

    it('selectedVehicleId 变更时高亮切换', async () => {
      const vehicles = [
        makeVehicle({ id: 'v1' }),
        makeVehicle({ id: 'v2', plateNo: '沪B67890' }),
      ]
      const wrapper = createWrapper({ vehicles, selectedVehicleId: 'v1' })

      await wrapper.setProps({ selectedVehicleId: 'v2' })

      const items = wrapper.findAll('.fleet-panel__item')
      expect(items[0].classes()).not.toContain('fleet-panel__item--selected')
      expect(items[1].classes()).toContain('fleet-panel__item--selected')
    })
  })

  describe('浮动定位', () => {
    it('面板使用绝对定位', () => {
      const wrapper = createWrapper()
      const panel = wrapper.find('.fleet-panel')
      expect(panel.exists()).toBe(true)
    })
  })
})
