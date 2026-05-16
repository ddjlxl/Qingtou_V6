import { describe, it, expect } from 'vitest'
import {
  containerTypeOptions,
  businessTypeOptions,
  documentOptions,
} from '../composables/useOrderFormOptions'
import { ContainerType, BusinessType, DocumentType } from '../types/order'

describe('useOrderFormOptions', () => {
  describe('containerTypeOptions', () => {
    it('has 4 options', () => {
      expect(containerTypeOptions).toHaveLength(4)
    })

    it('includes 20GP', () => {
      expect(containerTypeOptions).toContainEqual({ value: ContainerType.GP20, label: '20GP' })
    })

    it('includes 40GP', () => {
      expect(containerTypeOptions).toContainEqual({ value: ContainerType.GP40, label: '40GP' })
    })

    it('includes 40HQ', () => {
      expect(containerTypeOptions).toContainEqual({ value: ContainerType.HQ40, label: '40HQ' })
    })

    it('includes 45HQ', () => {
      expect(containerTypeOptions).toContainEqual({ value: ContainerType.HQ45, label: '45HQ' })
    })
  })

  describe('businessTypeOptions', () => {
    it('has 3 options', () => {
      expect(businessTypeOptions).toHaveLength(3)
    })

    it('includes heavy_transport', () => {
      expect(businessTypeOptions).toContainEqual({
        value: BusinessType.HEAVY_TRANSPORT,
        label: '重箱运输',
      })
    })

    it('includes empty_transport', () => {
      expect(businessTypeOptions).toContainEqual({
        value: BusinessType.EMPTY_TRANSPORT,
        label: '空箱运输',
      })
    })

    it('includes short_haul', () => {
      expect(businessTypeOptions).toContainEqual({
        value: BusinessType.SHORT_HAUL,
        label: '短驳',
      })
    })
  })

  describe('documentOptions', () => {
    it('has 3 options', () => {
      expect(documentOptions).toHaveLength(3)
    })

    it('includes pickup_order', () => {
      expect(documentOptions).toContainEqual({
        value: DocumentType.PICKUP_ORDER,
        label: '提箱单',
      })
    })

    it('includes weighing', () => {
      expect(documentOptions).toContainEqual({
        value: DocumentType.WEIGHING,
        label: '过磅',
      })
    })

    it('includes rectification', () => {
      expect(documentOptions).toContainEqual({
        value: DocumentType.RECTIFICATION,
        label: '整改',
      })
    })
  })
})