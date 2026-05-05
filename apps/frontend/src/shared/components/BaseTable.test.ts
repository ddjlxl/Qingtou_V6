import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import BaseTable from '@/shared/components/BaseTable.vue'

const columns = [
  { prop: 'name', label: '名称' },
  { prop: 'status', label: '状态' },
]

const data = [
  { name: '项目A', status: '进行中' },
  { name: '项目B', status: '已完成' },
]

function createWrapper(props = {}) {
  return mount(BaseTable, {
    props: { columns, data, ...props },
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('AC-003: BaseTable', () => {
  it('renders table with columns', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElTable' }).exists()).toBe(true)
    const columnComponents = wrapper.findAllComponents({ name: 'ElTableColumn' })
    expect(columnComponents).toHaveLength(2)
  })

  it('renders table with data rows', () => {
    const wrapper = createWrapper()
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
  })

  it('shows loading state', () => {
    const wrapper = createWrapper({ data: [], loading: true })
    expect(wrapper.find('.el-loading-mask').exists()).toBe(true)
  })

  it('shows empty state when no data', () => {
    const wrapper = createWrapper({ data: [] })
    expect(wrapper.find('.el-table__empty-text').exists()).toBe(true)
  })

  it('renders pagination when total exceeds pageSize', () => {
    const manyData = Array.from({ length: 30 }, (_, i) => ({
      name: `项目${i}`,
      status: '进行中',
    }))
    const wrapper = createWrapper({ data: manyData, pagination: true })
    expect(wrapper.find('.el-pagination').exists()).toBe(true)
  })

  it('does not render pagination when pagination is false', () => {
    const wrapper = createWrapper({ pagination: false })
    expect(wrapper.find('.el-pagination').exists()).toBe(false)
  })
})
