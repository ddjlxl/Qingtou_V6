import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('@/shared/api/client', () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
  },
}))

import { fleetService } from '../services/fleetService'

describe('fleetService - transport records', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTransportRecords', () => {
    it('calls GET with correct params', async () => {
      const params = { page: 1, pageSize: 20, startDate: '2026-01-01', endDate: '2026-01-31' }
      mockGet.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })

      await fleetService.getTransportRecords(params)

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/transport-records', { params })
    })

    it('calls GET without optional params', async () => {
      mockGet.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 })

      await fleetService.getTransportRecords()

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/transport-records', { params: undefined })
    })
  })

  describe('importTransportRecords', () => {
    it('calls POST with FormData containing file', async () => {
      const file = new File(['test'], 'test.xlsx')
      mockPost.mockResolvedValue({ totalRows: 10, successCount: 8, duplicateCount: 2, errorCount: 0 })

      await fleetService.importTransportRecords(file)

      expect(mockPost).toHaveBeenCalledWith('/v1/fleet/transport-records/import', expect.any(FormData))
      const formData = mockPost.mock.calls[0][1] as FormData
      expect(formData.get('file')).toBe(file)
    })
  })

  describe('getTransportRecordStatistics', () => {
    it('calls GET statistics endpoint', async () => {
      mockGet.mockResolvedValue({ byDriver: [], byVehicle: [] })

      await fleetService.getTransportRecordStatistics()

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/transport-records/statistics')
    })
  })

  describe('downloadTemplate', () => {
    it('calls GET template endpoint with blob responseType', async () => {
      mockGet.mockResolvedValue(new Blob())

      await fleetService.downloadTemplate()

      expect(mockGet).toHaveBeenCalledWith('/v1/fleet/transport-records/template', {
        responseType: 'blob',
      })
    })
  })

  describe('TransportRecord type - business_date field', () => {
    it('Bug: TransportRecord should have businessDate for date filtering, not importedAt', () => {
      // 验证类型定义包含 businessDate 字段
      // 当前 Bug: 日期筛选基于 imported_at（导入时间）而非业务时间
      // 修复后: TransportRecord 应包含 businessDate，筛选参数应传 start_date/end_date 基于 business_date
      const record: import('../types/transport-record').TransportRecord = {
        id: '1',
        orderNo: 'ORD-001',
        customerInfo: 'test',
        origin: 'A',
        destination: 'B',
        containerNo: 'CN-001',
        vehicleId: 'v1',
        driverId: 'd1',
        importedAt: '2026-05-01T00:00:00Z',
        businessDate: '2026-04-15',
      }
      expect(record.businessDate).toBeDefined()
    })

    it('Bug: TransportRecordListParams should support date filtering by business date', () => {
      const params: import('../types/transport-record').TransportRecordListParams = {
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        page: 1,
        pageSize: 20,
      }
      expect(params.startDate).toBe('2026-04-01')
      expect(params.endDate).toBe('2026-04-30')
    })
  })
})