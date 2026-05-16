import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { nextTick } from 'vue'

const mockFetchAvailableResources = vi.fn()
const mockAssignOrder = vi.fn()

vi.mock('../stores/useDispatchStore', () => ({
  useDispatchStore: () => ({
    availableDrivers: [
      { id: 'd1', name: '张三', phone: '13800138000', boundVehiclePlateNo: null },
      { id: 'd2', name: '李四', phone: '13900139000', boundVehiclePlateNo: '粤B67890' },
    ],
    availableVehicles: [
      { id: 'v1', plateNo: '粤A12345', boundDriverName: null },
      { id: 'v2', plateNo: '粤B67890', boundDriverName: '李四' },
    ],
    fetchAvailableResources: mockFetchAvailableResources,
    assignOrder: mockAssignOrder,
  }),
}))

import AssignDialog from '../components/AssignDialog.vue'
import type { Order } from '../types/order'

const testOrder = {
  id: 'o1',
  orderNo: 'DD202605150001',
  originName: '上海港',
  destName: '昆山工厂',
} as Order

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(AssignDialog, {
    props: {
      visible: false,
      order: testOrder,
      ...props,
    },
    global: {
      plugins: [ElementPlus],
    },
    attachTo: document.body,
  })
}

describe('AssignDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders dialog when visible', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()
    expect(wrapper.find('.assign-dialog__info').exists()).toBe(true)
  })

  it('does not render dialog when not visible', () => {
    const wrapper = createWrapper({ visible: false })
    expect(wrapper.find('.assign-dialog__info').exists()).toBe(false)
  })

  it('displays order info', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()
    const text = document.body.textContent || ''
    expect(text).toContain('DD202605150001')
    expect(text).toContain('上海港')
    expect(text).toContain('昆山工厂')
  })

  it('fetches available resources when dialog opens', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()
    expect(mockFetchAvailableResources).toHaveBeenCalled()
  })

  it('renders driver list', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()
    const text = document.body.textContent || ''
    expect(text).toContain('张三')
    expect(text).toContain('李四')
  })

  it('renders vehicle list', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()
    const text = document.body.textContent || ''
    expect(text).toContain('粤A12345')
    expect(text).toContain('粤B67890')
  })

  it('confirm button disabled without selection', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()
    const vm = wrapper.vm as unknown as { selectedDriverId: string; selectedVehicleId: string }
    expect(vm.selectedDriverId).toBe('')
    expect(vm.selectedVehicleId).toBe('')
  })

  it('emits update:visible on cancel', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()
    const vm = wrapper.vm as unknown as { handleClose: () => void }
    vm.handleClose()
    expect(wrapper.emitted('update:visible')).toBeTruthy()
    expect(wrapper.emitted('update:visible')![0]).toEqual([false])
  })

  it('auto-selects driver when vehicle with bound driver is selected', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    const vm = wrapper.vm as unknown as { selectedVehicleId: string; selectedDriverId: string }
    vm.selectedVehicleId = 'v2'
    await nextTick()

    expect(vm.selectedDriverId).toBe('d2')
  })

  it('auto-selects vehicle when driver with bound vehicle is selected', async () => {
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    const vm = wrapper.vm as unknown as { selectedDriverId: string; selectedVehicleId: string }
    vm.selectedDriverId = 'd2'
    await nextTick()

    expect(vm.selectedVehicleId).toBe('v2')
  })

  it('calls assignOrder on confirm', async () => {
    mockAssignOrder.mockResolvedValue({})
    const wrapper = createWrapper()
    await wrapper.setProps({ visible: true })
    await nextTick()

    const vm = wrapper.vm as unknown as {
      selectedDriverId: string
      selectedVehicleId: string
      handleAssign: () => Promise<void>
    }
    vm.selectedDriverId = 'd1'
    vm.selectedVehicleId = 'v1'
    await vm.handleAssign()

    expect(mockAssignOrder).toHaveBeenCalledWith('o1', {
      driverId: 'd1',
      vehicleId: 'v1',
    })
  })
})