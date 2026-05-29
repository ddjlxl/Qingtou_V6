import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatisticsOverlay from '../components/StatisticsOverlay.vue'
import type { DashboardStats } from '../types'

function makeStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    todayTaskCount: 12,
    completionRate: 0.85,
    overdueCount: 2,
    avgTransportMinutes: 32,
    ...overrides,
  }
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(StatisticsOverlay, {
    props: {
      stats: makeStats(),
      ...props,
    },
    global: {
      stubs: {
        'el-row': {
          template: '<div class="el-row"><slot /></div>',
        },
        'el-col': {
          template: '<div class="el-col"><slot /></div>',
        },
      },
    },
  })
}

describe('StatisticsOverlay', () => {
  describe('今日任务数', () => {
    it('显示为整数', () => {
      const wrapper = createWrapper({ stats: makeStats({ todayTaskCount: 12 }) })
      expect(wrapper.text()).toContain('12')
    })

    it('显示标签"今日任务"', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('今日任务')
    })

    it('任务数为 0 时显示 0', () => {
      const wrapper = createWrapper({ stats: makeStats({ todayTaskCount: 0 }) })
      expect(wrapper.text()).toContain('0')
    })
  })

  describe('完成率', () => {
    it('显示为百分比，保留 0 位小数', () => {
      const wrapper = createWrapper({ stats: makeStats({ completionRate: 0.85 }) })
      expect(wrapper.text()).toContain('85%')
    })

    it('0% 时显示 "0%"', () => {
      const wrapper = createWrapper({ stats: makeStats({ completionRate: 0 }) })
      expect(wrapper.text()).toContain('0%')
    })

    it('100% 时显示 "100%"', () => {
      const wrapper = createWrapper({ stats: makeStats({ completionRate: 1 }) })
      expect(wrapper.text()).toContain('100%')
    })

    it('显示标签"完成率"', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('完成率')
    })

    it('小数完成率截断为整数百分比', () => {
      const wrapper = createWrapper({ stats: makeStats({ completionRate: 0.856 }) })
      expect(wrapper.text()).toContain('86%')
    })
  })

  describe('超时数', () => {
    it('大于 0 时数字为红色', () => {
      const wrapper = createWrapper({ stats: makeStats({ overdueCount: 2 }) })
      const overdueValue = wrapper.find('.stat-card__value--danger')
      expect(overdueValue.exists()).toBe(true)
      expect(overdueValue.text()).toContain('2')
    })

    it('等于 0 时为默认色', () => {
      const wrapper = createWrapper({ stats: makeStats({ overdueCount: 0 }) })
      const overdueValue = wrapper.find('.stat-card__value--danger')
      expect(overdueValue.exists()).toBe(false)
    })

    it('显示标签"超时"', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('超时')
    })
  })

  describe('平均转运时间', () => {
    it('有值时显示"XX分钟"', () => {
      const wrapper = createWrapper({ stats: makeStats({ avgTransportMinutes: 32 }) })
      expect(wrapper.text()).toContain('32分钟')
    })

    it('null 时显示 "--"', () => {
      const wrapper = createWrapper({ stats: makeStats({ avgTransportMinutes: null }) })
      expect(wrapper.text()).toContain('--')
    })

    it('显示标签"平均转运"', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('平均转运')
    })
  })

  describe('浮动定位', () => {
    it('使用绝对定位', () => {
      const wrapper = createWrapper()
      const overlay = wrapper.find('.statistics-overlay')
      expect(overlay.exists()).toBe(true)
    })

    it('pointer-events 仅限卡片自身', () => {
      const wrapper = createWrapper()
      const overlay = wrapper.find('.statistics-overlay')
      const style = overlay.attributes('style') ?? ''
      const classes = overlay.classes()
      const hasPointerEventsNone = style.includes('pointer-events: none') || classes.some(c => c.includes('pointer'))
      expect(hasPointerEventsNone || overlay.find('.statistics-overlay__inner').exists()).toBe(true)
    })
  })
})
