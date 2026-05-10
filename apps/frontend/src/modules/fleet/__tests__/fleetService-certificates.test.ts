import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()

vi.mock('@/shared/api/client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}))

import { fleetService } from '../services/fleetService'
import { OwnerType, VehicleCertType } from '../types/certificate'

describe('fleetService - certificates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCertificates', () => {
    it('calls GET /v1/fleet/certificates', async () => {
      mockGet.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })

      await fleetService.getCertificates()

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/certificates', { params: undefined })
    })

    it('passes params to GET /v1/fleet/certificates', async () => {
      mockGet.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })

      await fleetService.getCertificates({
        ownerType: OwnerType.VEHICLE,
        expiringSoon: true,
        page: 1,
        pageSize: 10,
      })

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/certificates', {
        params: { ownerType: 'vehicle', expiringSoon: true, page: 1, pageSize: 10 },
      })
    })
  })

  describe('createCertificate', () => {
    it('calls POST /v1/fleet/certificates with FormData', async () => {
      const cert = { id: 'c1', certName: '行驶证' }
      mockPost.mockResolvedValue(cert)

      const result = await fleetService.createCertificate({
        ownerId: 'v1',
        ownerType: OwnerType.VEHICLE,
        certType: VehicleCertType.VEHICLE_LICENSE,
        certName: '行驶证',
        issueDate: '2026-01-01',
        expiryDate: '2027-01-01',
      })

      expect(mockPost).toHaveBeenCalledWith('/v1/fleet/certificates', expect.any(FormData))
      expect(result).toEqual(cert)
    })
  })

  describe('updateCertificate', () => {
    it('calls PUT /v1/fleet/certificates/:id with FormData', async () => {
      const cert = { id: 'c1', certName: '更新后的证照' }
      mockPut.mockResolvedValue(cert)

      const result = await fleetService.updateCertificate('c1', {
        certName: '更新后的证照',
      })

      expect(mockPut).toHaveBeenCalledWith('/v1/fleet/certificates/c1', expect.any(FormData))
      expect(result).toEqual(cert)
    })
  })

  describe('deleteCertificate', () => {
    it('calls DELETE /v1/fleet/certificates/:id', async () => {
      mockDelete.mockResolvedValue(undefined)

      await fleetService.deleteCertificate('c1')

      expect(mockDelete).toHaveBeenCalledWith('/v1/fleet/certificates/c1')
    })
  })

  describe('getCertificateWarningCount', () => {
    it('calls GET /v1/fleet/certificates/warning-count', async () => {
      mockGet.mockResolvedValue({ count: 5 })

      const result = await fleetService.getCertificateWarningCount()

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/certificates/warning-count')
      expect(result).toEqual({ count: 5 })
    })
  })
})