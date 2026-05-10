import { describe, it, expect } from 'vitest'
import {
  VehicleCertType,
  DriverCertType,
  OwnerType,
} from '../types/certificate'
import type {
  Certificate,
  CreateCertificateRequest,
  UpdateCertificateRequest,
  CertificateListParams,
} from '../types/certificate'

describe('Certificate types', () => {
  describe('VehicleCertType enum', () => {
    it('has VEHICLE_LICENSE', () => {
      expect(VehicleCertType.VEHICLE_LICENSE).toBe('vehicle_license')
    })

    it('has ROAD_TRANSPORT', () => {
      expect(VehicleCertType.ROAD_TRANSPORT).toBe('road_transport')
    })

    it('has COMPULSORY_INSURANCE', () => {
      expect(VehicleCertType.COMPULSORY_INSURANCE).toBe('compulsory_insurance')
    })

    it('has COMMERCIAL_INSURANCE', () => {
      expect(VehicleCertType.COMMERCIAL_INSURANCE).toBe('commercial_insurance')
    })

    it('has ANNUAL_INSPECTION', () => {
      expect(VehicleCertType.ANNUAL_INSPECTION).toBe('annual_inspection')
    })
  })

  describe('DriverCertType enum', () => {
    it('has DRIVING_LICENSE', () => {
      expect(DriverCertType.DRIVING_LICENSE).toBe('driving_license')
    })

    it('has QUALIFICATION', () => {
      expect(DriverCertType.QUALIFICATION).toBe('qualification')
    })
  })

  describe('OwnerType enum', () => {
    it('has VEHICLE', () => {
      expect(OwnerType.VEHICLE).toBe('vehicle')
    })

    it('has DRIVER', () => {
      expect(OwnerType.DRIVER).toBe('driver')
    })
  })

  describe('Certificate interface', () => {
    it('has all required fields', () => {
      const cert: Certificate = {
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
      }

      expect(cert.id).toBe('c1')
      expect(cert.ownerId).toBe('v1')
      expect(cert.ownerType).toBe(OwnerType.VEHICLE)
      expect(cert.ownerName).toBe('粤A12345')
      expect(cert.certType).toBe(VehicleCertType.VEHICLE_LICENSE)
      expect(cert.certName).toBe('行驶证')
      expect(cert.issueDate).toBe('2026-01-01')
      expect(cert.expiryDate).toBe('2027-01-01')
      expect(cert.attachment).toBeNull()
      expect(cert.remark).toBeNull()
      expect(cert.isExpiringSoon).toBe(false)
    })

    it('supports driver certificate', () => {
      const cert: Certificate = {
        id: 'c2',
        ownerId: 'd1',
        ownerType: OwnerType.DRIVER,
        ownerName: '张三',
        certType: DriverCertType.DRIVING_LICENSE,
        certName: '驾驶证',
        issueDate: '2025-06-01',
        expiryDate: '2031-06-01',
        attachment: '/uploads/certs/license.jpg',
        remark: 'A2驾照',
        isExpiringSoon: false,
        createdAt: '2025-06-01T00:00:00Z',
        updatedAt: '2025-06-01T00:00:00Z',
      }

      expect(cert.ownerType).toBe(OwnerType.DRIVER)
      expect(cert.certType).toBe(DriverCertType.DRIVING_LICENSE)
      expect(cert.attachment).toBe('/uploads/certs/license.jpg')
      expect(cert.remark).toBe('A2驾照')
    })
  })

  describe('CreateCertificateRequest', () => {
    it('has required fields for vehicle certificate', () => {
      const req: CreateCertificateRequest = {
        ownerId: 'v1',
        ownerType: OwnerType.VEHICLE,
        certType: VehicleCertType.VEHICLE_LICENSE,
        certName: '行驶证',
        issueDate: '2026-01-01',
        expiryDate: '2027-01-01',
      }

      expect(req.ownerId).toBe('v1')
      expect(req.ownerType).toBe(OwnerType.VEHICLE)
      expect(req.certType).toBe(VehicleCertType.VEHICLE_LICENSE)
      expect(req.certName).toBe('行驶证')
      expect(req.issueDate).toBe('2026-01-01')
      expect(req.expiryDate).toBe('2027-01-01')
    })

    it('supports optional attachment and remark', () => {
      const req: CreateCertificateRequest = {
        ownerId: 'd1',
        ownerType: OwnerType.DRIVER,
        certType: DriverCertType.DRIVING_LICENSE,
        certName: '驾驶证',
        issueDate: '2025-06-01',
        expiryDate: '2031-06-01',
        remark: '备注信息',
      }

      expect(req.remark).toBe('备注信息')
      expect(req.attachment).toBeUndefined()
    })
  })

  describe('UpdateCertificateRequest', () => {
    it('allows partial fields', () => {
      const req: UpdateCertificateRequest = {
        certName: '更新后的证照名',
      }

      expect(req.certName).toBe('更新后的证照名')
      expect(req.certType).toBeUndefined()
      expect(req.issueDate).toBeUndefined()
      expect(req.expiryDate).toBeUndefined()
    })

    it('allows updating expiry date', () => {
      const req: UpdateCertificateRequest = {
        expiryDate: '2028-01-01',
      }

      expect(req.expiryDate).toBe('2028-01-01')
    })
  })

  describe('CertificateListParams', () => {
    it('has optional filter fields', () => {
      const params: CertificateListParams = {
        ownerType: OwnerType.VEHICLE,
        ownerId: 'v1',
        expiringSoon: true,
        page: 1,
        pageSize: 20,
      }

      expect(params.ownerType).toBe(OwnerType.VEHICLE)
      expect(params.ownerId).toBe('v1')
      expect(params.expiringSoon).toBe(true)
      expect(params.page).toBe(1)
      expect(params.pageSize).toBe(20)
    })

    it('allows empty params', () => {
      const params: CertificateListParams = {}

      expect(params.ownerType).toBeUndefined()
      expect(params.expiringSoon).toBeUndefined()
    })
  })
})