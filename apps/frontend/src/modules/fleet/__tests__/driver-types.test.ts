import { describe, it, expect } from 'vitest'
import type { Driver, CreateDriverRequest, UpdateDriverRequest, DriverListParams } from '../types/driver'

describe('Driver types', () => {
  it('Driver interface has all required fields', () => {
    const driver: Driver = {
      id: 'd1',
      name: '张三',
      phone: '13800138000',
      boundVehicleId: null,
      boundVehiclePlateNo: undefined,
      isDisabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }

    expect(driver.id).toBe('d1')
    expect(driver.name).toBe('张三')
    expect(driver.phone).toBe('13800138000')
    expect(driver.boundVehicleId).toBeNull()
    expect(driver.isDisabled).toBe(false)
  })

  it('CreateDriverRequest has name and phone', () => {
    const req: CreateDriverRequest = {
      name: '李四',
      phone: '13900139000',
    }

    expect(req.name).toBe('李四')
    expect(req.phone).toBe('13900139000')
  })

  it('UpdateDriverRequest allows partial fields', () => {
    const req: UpdateDriverRequest = {
      name: '王五',
    }

    expect(req.name).toBe('王五')
    expect(req.phone).toBeUndefined()
  })

  it('DriverListParams has optional page and pageSize', () => {
    const params: DriverListParams = {
      page: 1,
      pageSize: 20,
    }

    expect(params.page).toBe(1)
    expect(params.pageSize).toBe(20)
  })
})