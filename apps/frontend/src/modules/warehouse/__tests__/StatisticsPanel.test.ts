import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatisticsPanel from '../components/StatisticsPanel.vue'
import type { WarehouseStatistics } from '../types'

function makeStats(overrides: Partial<WarehouseStatistics> = {}): WarehouseStatistics {
  return {
    totalSlots: 100,
    usedSlots: 60,
    availableSlots: 40,
    heavyCount: 45,
    emptyContainerCount: 15,
    utilizationRate: 0.6,
    ...overrides,
  }
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(StatisticsPanel, {
    props: {
      stats: makeStats(),
      ...props,
    },
  })
}

describe('StatisticsPanel', () => {
  describe('统计数据显示', () => {
    it('显示总库位数', () => {
      const wrapper = createWrapper({ stats: makeStats({ totalSlots: 120 }) })
      expect(wrapper.text()).toContain('120')
      expect(wrapper.text()).toContain('总库位')
    })

    it('显示已占用数', () => {
      const wrapper = createWrapper({ stats: makeStats({ usedSlots: 80 }) })
      expect(wrapper.text()).toContain('80')
      expect(wrapper.text()).toContain('已占用')
    })

    it('显示空闲数', () => {
      const wrapper = createWrapper({ stats: makeStats({ availableSlots: 40 }) })
      expect(wrapper.text()).toContain('40')
      expect(wrapper.text()).toContain('空闲')
    })

    it('显示重箱数', () => {
      const wrapper = createWrapper({ stats: makeStats({ heavyCount: 55 }) })
      expect(wrapper.text()).toContain('55')
      expect(wrapper.text()).toContain('重箱')
    })

    it('显示空箱数', () => {
      const wrapper = createWrapper({ stats: makeStats({ emptyContainerCount: 25 }) })
      expect(wrapper.text()).toContain('25')
      expect(wrapper.text()).toContain('空箱')
    })

    it('显示利用率', () => {
      const wrapper = createWrapper({ stats: makeStats({ utilizationRate: 0.75 }) })
      expect(wrapper.text()).toContain('75.0%')
      expect(wrapper.text()).toContain('利用率')
    })
  })

  describe('利用率计算', () => {
    it('正确计算利用率百分比', () => {
      const wrapper = createWrapper({ stats: makeStats({ utilizationRate: 0.6 }) })
      expect(wrapper.text()).toContain('60.0%')
    })

    it('利用率为 0 时显示 0.0%', () => {
      const wrapper = createWrapper({ stats: makeStats({ utilizationRate: 0 }) })
      expect(wrapper.text()).toContain('0.0%')
    })

    it('利用率为 1 时显示 100.0%', () => {
      const wrapper = createWrapper({ stats: makeStats({ utilizationRate: 1 }) })
      expect(wrapper.text()).toContain('100.0%')
    })

    it('利用率保留一位小数', () => {
      const wrapper = createWrapper({ stats: makeStats({ utilizationRate: 0.666 }) })
      expect(wrapper.text()).toContain('66.6%')
    })
  })

  describe('样式类', () => {
    it('已占用数值使用 primary 样式', () => {
      const wrapper = createWrapper()
      const usedValue = wrapper.findAll('.stat-item__value')[1]
      expect(usedValue.classes()).toContain('stat-item__value--primary')
    })

    it('空闲数值使用 success 样式', () => {
      const wrapper = createWrapper()
      const availableValue = wrapper.findAll('.stat-item__value')[2]
      expect(availableValue.classes()).toContain('stat-item__value--success')
    })

    it('重箱数值使用 warning 样式', () => {
      const wrapper = createWrapper()
      const heavyValue = wrapper.findAll('.stat-item__value')[3]
      expect(heavyValue.classes()).toContain('stat-item__value--warning')
    })

    it('空箱数值使用 info 样式', () => {
      const wrapper = createWrapper()
      const emptyValue = wrapper.findAll('.stat-item__value')[4]
      expect(emptyValue.classes()).toContain('stat-item__value--info')
    })
  })
})
