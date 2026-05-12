import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockGetTransportRecords = vi.fn()
const mockImportTransportRecords = vi.fn()
const mockGetTransportRecordStatistics = vi.fn()
const mockDownloadTemplate = vi.fn()

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
    getCertificates: vi.fn(),
    createCertificate: vi.fn(),
    updateCertificate: vi.fn(),
    deleteCertificate: vi.fn(),
    getTransportRecords: (...args: unknown[]) => mockGetTransportRecords(...args),
    importTransportRecords: (...args: unknown[]) => mockImportTransportRecords(...args),
    getTransportRecordStatistics: (...args: unknown[]) => mockGetTransportRecordStatistics(...args),
    downloadTemplate: (...args: unknown[]) => mockDownloadTemplate(...args),
  },
}))

import { useFleetStore } from '../stores/useFleetStore'

function makeTransportRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tr1',
    orderNo: 'ORD001',
    customerInfo: '测试客户',
    origin: '广州',
    destination: '深圳',
    containerNo: 'CONT001',
    vehicleId: 'v1',
    vehiclePlateNo: '粤A12345',
    driverId: 'd1',
    driverName: '张三',
    importedAt: '2026-05-01T00:00:00Z',
    ...overrides,
  }
}

describe('useFleetStore - transport records', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has empty transportRecords array', () => {
      const store = useFleetStore()
      expect(store.transportRecords).toEqual([])
    })

    it('has transportRecordLoading as false', () => {
      const store = useFleetStore()
      expect(store.transportRecordLoading).toBe(false)
    })

    it('has transportRecordError as null', () => {
      const store = useFleetStore()
      expect(store.transportRecordError).toBeNull()
    })

    it('has transportRecordTotal as 0', () => {
      const store = useFleetStore()
      expect(store.transportRecordTotal).toBe(0)
    })

    it('has transportRecordStatistics as null', () => {
      const store = useFleetStore()
      expect(store.transportRecordStatistics).toBeNull()
    })
  })

  describe('fetchTransportRecords', () => {
    it('loads transport records into state', async () => {
      const store = useFleetStore()
      const records = [makeTransportRecord(), makeTransportRecord({ id: 'tr2', orderNo: 'ORD002' })]
      mockGetTransportRecords.mockResolvedValue({ items: records, total: 2, page: 1, pageSize: 20 })

      await store.fetchTransportRecords()

      expect(store.transportRecords).toEqual(records)
      expect(store.transportRecordTotal).toBe(2)
      expect(store.transportRecordLoading).toBe(false)
    })

    it('passes params to service', async () => {
      const store = useFleetStore()
      const params = { page: 1, pageSize: 10, startDate: '2026-01-01', endDate: '2026-01-31' }
      mockGetTransportRecords.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 })

      await store.fetchTransportRecords(params)

      expect(mockGetTransportRecords).toHaveBeenCalledWith(params)
    })

    it('sets error on failure', async () => {
      const store = useFleetStore()
      mockGetTransportRecords.mockRejectedValue(new Error('网络错误'))

      await expect(store.fetchTransportRecords()).rejects.toThrow('网络错误')
      expect(store.transportRecordError).toBe('网络错误')
      expect(store.transportRecordLoading).toBe(false)
    })
  })

  describe('importTransportRecords', () => {
    it('imports file and returns result', async () => {
      const store = useFleetStore()
      const file = new File(['test'], 'test.txt')
      const importResult = { totalRows: 10, successCount: 8, duplicateCount: 2, errorCount: 0 }
      mockImportTransportRecords.mockResolvedValue(importResult)

      const result = await store.importTransportRecords(file)

      expect(result).toEqual(importResult)
      expect(mockImportTransportRecords).toHaveBeenCalledWith(file)
      expect(store.transportRecordLoading).toBe(false)
    })

    it('sets error on failure', async () => {
      const store = useFleetStore()
      const file = new File(['test'], 'test.txt')
      mockImportTransportRecords.mockRejectedValue(new Error('格式错误'))

      await expect(store.importTransportRecords(file)).rejects.toThrow('格式错误')
      expect(store.transportRecordError).toBe('格式错误')
      expect(store.transportRecordLoading).toBe(false)
    })
  })

  describe('fetchTransportRecordStatistics', () => {
    it('loads statistics into state', async () => {
      const store = useFleetStore()
      const stats = {
        byDriver: [{ driverId: 'd1', driverName: '张三', count: 5 }],
        byVehicle: [{ vehicleId: 'v1', vehiclePlateNo: '粤A12345', count: 5 }],
      }
      mockGetTransportRecordStatistics.mockResolvedValue(stats)

      await store.fetchTransportRecordStatistics()

      expect(store.transportRecordStatistics).toEqual(stats)
      expect(store.transportRecordLoading).toBe(false)
    })

    it('sets error on failure', async () => {
      const store = useFleetStore()
      mockGetTransportRecordStatistics.mockRejectedValue(new Error('统计失败'))

      await expect(store.fetchTransportRecordStatistics()).rejects.toThrow('统计失败')
      expect(store.transportRecordError).toBe('统计失败')
      expect(store.transportRecordLoading).toBe(false)
    })
  })

  describe('downloadTransportRecordTemplate', () => {
    it('downloads template successfully', async () => {
      const store = useFleetStore()
      const blob = new Blob(['test'], { type: 'text/plain' })
      mockDownloadTemplate.mockResolvedValue(blob)

      await store.downloadTransportRecordTemplate()

      expect(mockDownloadTemplate).toHaveBeenCalled()
    })

    it('sets error on failure', async () => {
      const store = useFleetStore()
      mockDownloadTemplate.mockRejectedValue(new Error('下载失败'))

      await expect(store.downloadTransportRecordTemplate()).rejects.toThrow('下载失败')
      expect(store.transportRecordError).toBe('下载失败')
    })
  })

  describe('resetState', () => {
    it('resets transport record state', () => {
      const store = useFleetStore()
      store.transportRecords = [makeTransportRecord()]
      store.transportRecordLoading = true
      store.transportRecordError = 'some error'
      store.transportRecordTotal = 10
      store.transportRecordStatistics = { byDriver: [], byVehicle: [] }

      store.resetState()

      expect(store.transportRecords).toEqual([])
      expect(store.transportRecordLoading).toBe(false)
      expect(store.transportRecordError).toBeNull()
      expect(store.transportRecordTotal).toBe(0)
      expect(store.transportRecordStatistics).toBeNull()
    })
  })
})