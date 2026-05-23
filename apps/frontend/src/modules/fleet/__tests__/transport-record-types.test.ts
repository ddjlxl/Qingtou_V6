/** Task-03 测试：TransportRecord containerStatus 字段
 * 覆盖 AC：AC-022（运输流水列表显示"空重箱状态"列）
 * 
 * Task-NEW 测试：TransportRecord waypoints 字段
 * 覆盖 AC：AC-037（运输流水列表显示途径地）
 */
import { describe, it, expect } from 'vitest'
import type { TransportRecord } from '../types/transport-record'

describe('TransportRecord interface - containerStatus field', () => {
  it('accepts containerStatus with heavy value', () => {
    const record: TransportRecord = {
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
      containerStatus: 'heavy',
    }
    expect(record.containerStatus).toBe('heavy')
  })

  it('accepts containerStatus with empty value', () => {
    const record: TransportRecord = {
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
      containerStatus: 'empty',
    }
    expect(record.containerStatus).toBe('empty')
  })

  it('accepts containerStatus with null value', () => {
    const record: TransportRecord = {
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
      containerStatus: null,
    }
    expect(record.containerStatus).toBeNull()
  })

  it('accepts record without containerStatus (undefined)', () => {
    const record: TransportRecord = {
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
    }
    expect(record.containerStatus).toBeUndefined()
  })

  describe('waypoints field', () => {
    it('accepts waypoints as array of strings', () => {
      const record: TransportRecord = {
        id: 'tr1',
        orderNo: 'ORD001',
        customerInfo: '测试客户',
        origin: '广州',
        destination: '深圳',
        waypoints: ['苏州', '无锡'],
        containerNo: 'CONT001',
        vehicleId: 'v1',
        vehiclePlateNo: '粤A12345',
        driverId: 'd1',
        driverName: '张三',
        importedAt: '2026-05-01T00:00:00Z',
      }
      expect(record.waypoints).toEqual(['苏州', '无锡'])
    })

    it('accepts waypoints as null', () => {
      const record: TransportRecord = {
        id: 'tr1',
        orderNo: 'ORD001',
        customerInfo: '测试客户',
        origin: '广州',
        destination: '深圳',
        waypoints: null,
        containerNo: 'CONT001',
        vehicleId: 'v1',
        vehiclePlateNo: '粤A12345',
        driverId: 'd1',
        driverName: '张三',
        importedAt: '2026-05-01T00:00:00Z',
      }
      expect(record.waypoints).toBeNull()
    })

    it('accepts record without waypoints (undefined)', () => {
      const record: TransportRecord = {
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
      }
      expect(record.waypoints).toBeUndefined()
    })
  })
})
