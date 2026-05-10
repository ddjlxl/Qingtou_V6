import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ElementPlus from 'element-plus'

const mockFetchCertificates = vi.fn()

vi.mock('../stores/useFleetStore', () => ({
  useFleetStore: () => ({
    certificates: [
      {
        id: 'c1',
        ownerId: 'v1',
        ownerType: 'vehicle',
        ownerName: '粤A12345',
        certType: 'vehicle_license',
        certName: '行驶证',
        issueDate: '2026-01-01',
        expiryDate: '2027-01-01',
        attachment: null,
        remark: null,
        isExpiringSoon: false,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    certificateLoading: false,
    certificateError: null,
    fetchCertificates: mockFetchCertificates,
    deleteCertificate: vi.fn(),
  }),
}))

import CertificateManagement from '../components/CertificateManagement.vue'

function createWrapper() {
  return mount(CertificateManagement, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        CertificateFormDialog: {
          template: '<div class="form-dialog" v-if="visible"></div>',
          props: ['visible', 'certificate'],
          emits: ['update:visible', 'success'],
        },
      },
    },
  })
}

describe('CertificateManagement', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders certificate management container', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.certificate-management').exists()).toBe(true)
  })

  it('calls fetchCertificates on mount', () => {
    createWrapper()
    expect(mockFetchCertificates).toHaveBeenCalled()
  })

  it('renders expiring soon filter button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('即将到期')
  })

  it('renders add certificate button', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('新增证照')
  })

  it('renders el-table component', () => {
    const wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'ElTable' }).exists()).toBe(true)
  })
})