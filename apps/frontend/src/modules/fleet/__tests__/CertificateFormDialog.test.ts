import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'

const mockCreateCertificate = vi.fn()
const mockUpdateCertificate = vi.fn()

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => ({
    createCertificate: mockCreateCertificate,
    updateCertificate: mockUpdateCertificate,
  }),
}))

import CertificateFormDialog from '../components/CertificateFormDialog.vue'
import { OwnerType, VehicleCertType } from '../types/certificate'

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
})