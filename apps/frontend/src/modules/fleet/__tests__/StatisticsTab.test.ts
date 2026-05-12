import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'

const mockFetchStatistics = vi.fn()

let mockStoreState = {
  statistics: { certificateWarningCount: 3, monthTaskCount: 42 } as { certificateWarningCount: number; monthTaskCount: number } | null,
  statisticsLoading: false,
  statisticsError: null as string | null,
  fetchStatistics: mockFetchStatistics,
}

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => mockStoreState,
}))

import StatisticsTab from '../components/StatisticsTab.vue'

function createWrapper() {
  return mount(StatisticsTab, {
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('StatisticsTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStoreState = {
      statistics: { certificateWarningCount: 3, monthTaskCount: 42 },
      statisticsLoading: false,
      statisticsError: null,
      fetchStatistics: mockFetchStatistics,
    }
  })

  it('renders statistics container', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.statistics-tab').exists()).toBe(true)
  })

  it('calls fetchStatistics on mount', () => {
    createWrapper()
    expect(mockFetchStatistics).toHaveBeenCalled()
  })

  it('renders certificate warning card', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('证照预警')
    expect(wrapper.text()).toContain('3')
  })

  it('renders month task count card', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('本月任务')
    expect(wrapper.text()).toContain('42')
  })

  it('emits tab-change when certificate warning card is clicked', async () => {
    const wrapper = createWrapper()
    const card = wrapper.find('.stat-card--warning')
    await card.trigger('click')
    expect(wrapper.emitted('tab-change')).toBeTruthy()
    expect(wrapper.emitted('tab-change')?.[0]).toEqual(['certificate'])
  })

  it('shows loading spinner when loading', () => {
    mockStoreState.statisticsLoading = true
    mockStoreState.statistics = null
    const wrapper = createWrapper()
    expect(wrapper.find('.statistics-loading').exists()).toBe(true)
    expect(wrapper.find('.stat-card').exists()).toBe(false)
  })

  it('shows statistics cards when loaded', () => {
    mockStoreState.statisticsLoading = false
    const wrapper = createWrapper()
    expect(wrapper.find('.statistics-loading').exists()).toBe(false)
    expect(wrapper.findAll('.stat-card').length).toBeGreaterThan(0)
  })
})