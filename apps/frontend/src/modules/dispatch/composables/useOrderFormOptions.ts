import { BusinessType, DocumentType, ContainerType } from '../types/order'

export const containerTypeOptions = [
  { value: ContainerType.GP20, label: '20GP' },
  { value: ContainerType.GP40, label: '40GP' },
  { value: ContainerType.HQ40, label: '40HQ' },
  { value: ContainerType.HQ45, label: '45HQ' },
]

export const businessTypeOptions = [
  { value: BusinessType.HEAVY_TRANSPORT, label: '重箱运输' },
  { value: BusinessType.EMPTY_TRANSPORT, label: '空箱运输' },
  { value: BusinessType.SHORT_HAUL, label: '短驳' },
]

export const documentOptions = [
  { value: DocumentType.PICKUP_ORDER, label: '提箱单' },
  { value: DocumentType.WEIGHING, label: '过磅' },
  { value: DocumentType.RECTIFICATION, label: '整改' },
]