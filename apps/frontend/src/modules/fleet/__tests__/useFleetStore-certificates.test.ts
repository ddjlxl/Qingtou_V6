import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockGetCertificates = vi.fn()
const mockCreateCertificate = vi.fn()
const mockUpdateCertificate = vi.fn()
const mockDeleteCertificate = vi.fn()

vi.mock('../services/fleetService', () => ({
  fleetService: {
    getVehicles: vi.fn(),
    createVehicle: vi.fn(),
    updateVehicle: vi.fn(),
    disableVehicle: vi.fn(),
    getDrivers: vi.fn(),
    createDriver: vi.fn(),
    updateDriver: vi.fn(),
    disableDriver: vi.fn(),
    deleteDriver: vi.fn(),
    getCertificates: (...args: unknown[]) => mockGetCertificates(...args),
    createCertificate: (...args: unknown[]) => mockCreateCertificate(...args),
    updateCertificate: (...args: unknown[]) => mockUpdateCertificate(...args),
    deleteCertificate: (...args: unknown[]) => mockDeleteCertificate(...args),
  },
}))

import { useFleetStore } from '../stores/useFleetStore'
import { OwnerType, VehicleCertType } from '../types/certificate'

function makeCertificate(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  }
}

describe('useFleetStore - certificates', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty certificates array', () => {
      const store = useFleetStore()
      expect(store.certificates).toEqual([])
    })

    it('has certificateLoading as false', () => {
      const store = useFleetStore()
      expect(store.certificateLoading).toBe(false)
    })

    it('has certificateError as null', () => {
      const store = useFleetStore()
      expect(store.certificateError).toBeNull()
    })
  })

  describe('fetchCertificates', () => {
    it('loads certificates into state', async () => {
      const store = useFleetStore()
      const certs = [makeCertificate(), makeCertificate({ id: 'c2', certName: '交强险' })]
      mockGetCertificates.mockResolvedValue({ items: certs, total: 2, page: 1, pageSize: 20 })

      await store.fetchCertificates()

      expect(store.certificates).toEqual(certs)
      expect(store.certificateLoading).toBe(false)
    })

    it('sets error on failure', async () => {
      const store = useFleetStore()
      mockGetCertificates.mockRejectedValue(new Error('网络错误'))

      await store.fetchCertificates()

      expect(store.certificateError).toBe('网络错误')
      expect(store.certificateLoading).toBe(false)
    })
  })

  describe('createCertificate', () => {
    it('adds new certificate to beginning of list', async () => {
      const store = useFleetStore()
      store.certificates = [makeCertificate({ id: 'c2', certName: '交强险' })]
      const newCert = makeCertificate({ id: 'c1', certName: '行驶证' })
      mockCreateCertificate.mockResolvedValue(newCert)

      await store.createCertificate({
        ownerId: 'v1',
        ownerType: OwnerType.VEHICLE,
        certType: VehicleCertType.VEHICLE_LICENSE,
        certName: '行驶证',
        issueDate: '2026-01-01',
        expiryDate: '2027-01-01',
      })

      expect(store.certificates).toHaveLength(2)
      expect(store.certificates[0].id).toBe('c1')
    })

    it('throws error on failure', async () => {
      const store = useFleetStore()
      mockCreateCertificate.mockRejectedValue(new Error('创建失败'))

      await expect(
        store.createCertificate({
          ownerId: 'v1',
          ownerType: OwnerType.VEHICLE,
          certType: VehicleCertType.VEHICLE_LICENSE,
          certName: '行驶证',
          issueDate: '2026-01-01',
          expiryDate: '2027-01-01',
        })
      ).rejects.toThrow('创建失败')

      expect(store.certificateError).toBe('创建失败')
    })
  })

  describe('updateCertificate', () => {
    it('updates certificate in list', async () => {
      const store = useFleetStore()
      store.certificates = [makeCertificate()]
      const updated = makeCertificate({ certName: '更新后的证照' })
      mockUpdateCertificate.mockResolvedValue(updated)

      await store.updateCertificate('c1', { certName: '更新后的证照' })

      expect(store.certificates[0].certName).toBe('更新后的证照')
    })

    it('throws error on failure', async () => {
      const store = useFleetStore()
      mockUpdateCertificate.mockRejectedValue(new Error('更新失败'))

      await expect(
        store.updateCertificate('c1', { certName: '更新' })
      ).rejects.toThrow('更新失败')
    })
  })

  describe('deleteCertificate', () => {
    it('removes certificate from list', async () => {
      const store = useFleetStore()
      store.certificates = [makeCertificate(), makeCertificate({ id: 'c2' })]
      mockDeleteCertificate.mockResolvedValue(undefined)

      await store.deleteCertificate('c1')

      expect(store.certificates).toHaveLength(1)
      expect(store.certificates[0].id).toBe('c2')
    })

    it('throws error on failure', async () => {
      const store = useFleetStore()
      mockDeleteCertificate.mockRejectedValue(new Error('删除失败'))

      await expect(
        store.deleteCertificate('c1')
      ).rejects.toThrow('删除失败')
    })
  })
})