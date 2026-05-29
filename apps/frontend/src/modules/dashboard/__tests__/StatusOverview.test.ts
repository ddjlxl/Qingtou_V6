import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusOverview from '../components/StatusOverview.vue'
import type { StatusCounts } from '../types'

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
  return mount(StatusOverview, {
    props: {
      statusCounts: makeStatusCounts(),
      ...props,
    },
    global: {
      stubs: {
        'el-tag': {
          template: '<span class="el-tag"><slot /></span>',
          props: ['type'],
        },
      },
    },
  })
}

describe('StatusOverview', () => {
  describe('5 行状态统计渲染', () => {
    it('显示"待分配"标签和数量', () => {
      const wrapper = createWrapper({ statusCounts: makeStatusCounts({ pending: 5 }) })
      expect(wrapper.text()).toContain('待分配')
      expect(wrapper.text()).toContain('5')
    })

    it('显示"已分配"标签和数量', () => {
      const wrapper = createWrapper({ statusCounts: makeStatusCounts({ assigned: 3 }) })
      expect(wrapper.text()).toContain('已分配')
      expect(wrapper.text()).toContain('3')
    })

    it('显示"运输中"标签和数量', () => {
      const wrapper = createWrapper({ statusCounts: makeStatusCounts({ transiting: 8 }) })
      expect(wrapper.text()).toContain('运输中')
      expect(wrapper.text()).toContain('8')
    })

    it('显示"已完成"标签和数量', () => {
      const wrapper = createWrapper({ statusCounts: makeStatusCounts({ completed: 123 }) })
      expect(wrapper.text()).toContain('已完成')
      expect(wrapper.text()).toContain('123')
    })

    it('显示"超时"标签和数量', () => {
      const wrapper = createWrapper({ statusCounts: makeStatusCounts({ overdue: 1 }) })
      expect(wrapper.text()).toContain('超时')
      expect(wrapper.text()).toContain('1')
    })
  })

  describe('边界情况', () => {
    it('所有计数为 0 时正常显示', () => {
      const wrapper = createWrapper({
        statusCounts: makeStatusCounts({
          pending: 0,
          assigned: 0,
          transiting: 0,
          completed: 0,
          overdue: 0,
        }),
      })
      expect(wrapper.text()).toContain('待分配')
      expect(wrapper.text()).toContain('已分配')
      expect(wrapper.text()).toContain('运输中')
      expect(wrapper.text()).toContain('已完成')
      expect(wrapper.text()).toContain('超时')
    })

    it('数字与后端一致', () => {
      const counts = makeStatusCounts({
        pending: 10,
        assigned: 20,
        transiting: 30,
        completed: 40,
        overdue: 5,
      })
      const wrapper = createWrapper({ statusCounts: counts })

      expect(wrapper.text()).toContain('10')
      expect(wrapper.text()).toContain('20')
      expect(wrapper.text()).toContain('30')
      expect(wrapper.text()).toContain('40')
      expect(wrapper.text()).toContain('5')
    })
  })
})
