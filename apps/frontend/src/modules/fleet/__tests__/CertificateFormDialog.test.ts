import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import { nextTick } from 'vue'

const mockCreateCertificate = vi.fn()
const mockUpdateCertificate = vi.fn()
const mockFetchVehicles = vi.fn()
const mockFetchDrivers = vi.fn()

const mockVehicles = [
  { id: 'v1', plateNo: '粤A12345', isDisabled: false },
  { id: 'v2', plateNo: '粤B67890', isDisabled: true },
]
const mockDrivers = [
  { id: 'd1', name: '张三', isDisabled: false },
  { id: 'd2', name: '李四', isDisabled: true },
]

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => ({
    vehicles: mockVehicles,
    drivers: mockDrivers,
    fetchVehicles: mockFetchVehicles,
    fetchDrivers: mockFetchDrivers,
    createCertificate: mockCreateCertificate,
    updateCertificate: mockUpdateCertificate,
  }),
}))

import CertificateFormDialog from '../components/CertificateFormDialog.vue'
import { OwnerType, VehicleCertType } from '../types/certificate'
import type { CertType } from '../types/certificate'

interface CertificateFormDialogVM {
  form: {
    ownerId: string
    ownerType: OwnerType
    certType: CertType
    certName: string
    issueDate: string
    expiryDate: string
    remark: string
  }
  ownerOptions: { label: string; value: string }[]
}

function createWrapper(props = {}) {
  return mount(CertificateFormDialog, {
    props: {
      visible: true,
      certificate: null,
      ...props,
    },
    global: {
      plugins: [ElementPlus],
    },
  })
}

describe('CertificateFormDialog', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  it('renders dialog when visible', () => {
    wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElDialog' }).exists()).toBe(true)
  })

  it('shows create title when no certificate prop', () => {
    wrapper = createWrapper()
    const dialog = wrapper.findComponent({ name: 'ElDialog' })
    expect(dialog.props('title')).toBe('新增证照')
  })

  it('shows edit title when certificate prop provided', () => {
    wrapper = createWrapper({
      visible: true,
      certificate: {
        id: 'c1',
        ownerId: 'v1',
        ownerType: OwnerType.VEHICLE,
        ownerName: '粤A12345',
        certType: VehicleCertType.VEHICLE_LICENSE,
        certName: '行驶证',
        issueDate: '2026-01-01',
        expiryDate: '2027-01-01',
        attachment: null,
        remark: null,
        isExpiringSoon: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    })
    const dialog = wrapper.findComponent({ name: 'ElDialog' })
    expect(dialog.props('title')).toBe('编辑证照')
  })

  it('renders el-dialog with correct width', () => {
    wrapper = createWrapper()
    const dialog = wrapper.findComponent({ name: 'ElDialog' })
    expect(dialog.props('width')).toBe('520px')
  })

  it('emits update:visible when dialog close event fires', () => {
    wrapper = createWrapper()
    const dialog = wrapper.findComponent({ name: 'ElDialog' })
    dialog.vm.$emit('update:model-value', false)
    expect(wrapper.emitted('update:visible')).toBeTruthy()
    expect(wrapper.emitted('update:visible')![0]).toEqual([false])
  })

  it('calls fetchVehicles and fetchDrivers when dialog opens', () => {
    wrapper = createWrapper()
    expect(mockFetchVehicles).toHaveBeenCalled()
    expect(mockFetchDrivers).toHaveBeenCalled()
  })

  it('computes ownerOptions from vehicles excluding disabled when ownerType is vehicle', () => {
    wrapper = createWrapper()
    const vm = wrapper.vm as unknown as CertificateFormDialogVM
    expect(vm.form.ownerType).toBe(OwnerType.VEHICLE)
    expect(vm.ownerOptions).toEqual([{ label: '粤A12345', value: 'v1' }])
  })

  it('computes ownerOptions from drivers excluding disabled when ownerType is driver', async () => {
    wrapper = createWrapper()
    const vm = wrapper.vm as unknown as CertificateFormDialogVM
    vm.form.ownerType = OwnerType.DRIVER
    await nextTick()
    expect(vm.ownerOptions).toEqual([{ label: '张三', value: 'd1' }])
  })

  it('clears ownerId when ownerType changes', async () => {
    wrapper = createWrapper()
    const vm = wrapper.vm as unknown as CertificateFormDialogVM
    vm.form.ownerId = 'v1'
    await wrapper.vm.$nextTick()
    vm.form.ownerType = OwnerType.DRIVER
    await wrapper.vm.$nextTick()
    expect(vm.form.ownerId).toBe('')
  })

  it('auto-fills certName when certType changes to vehicle license', async () => {
    wrapper = createWrapper()
    const vm = wrapper.vm as unknown as CertificateFormDialogVM
    vm.form.certType = VehicleCertType.COMMERCIAL_INSURANCE
    await nextTick()
    vm.form.certType = VehicleCertType.VEHICLE_LICENSE
    await nextTick()
    expect(vm.form.certName).toBe('行驶证')
  })

  it('auto-fills certName when certType changes to road transport', async () => {
    wrapper = createWrapper()
    const vm = wrapper.vm as unknown as CertificateFormDialogVM
    vm.form.certType = VehicleCertType.ROAD_TRANSPORT
    await nextTick()
    expect(vm.form.certName).toBe('道路运输证')
  })

  it('auto-fills certName when ownerType switches to driver', async () => {
    wrapper = createWrapper()
    const vm = wrapper.vm as unknown as CertificateFormDialogVM
    vm.form.ownerType = OwnerType.DRIVER
    await nextTick()
    expect(vm.form.certName).toBe('驾驶证')
  })
})