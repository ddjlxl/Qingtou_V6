export enum VehicleCertType {
  VEHICLE_LICENSE = 'vehicle_license',
  ROAD_TRANSPORT = 'road_transport',
  COMPULSORY_INSURANCE = 'compulsory_insurance',
  COMMERCIAL_INSURANCE = 'commercial_insurance',
  ANNUAL_INSPECTION = 'annual_inspection',
}

export enum DriverCertType {
  DRIVING_LICENSE = 'driving_license',
  QUALIFICATION = 'qualification',
}

export type CertType = VehicleCertType | DriverCertType

export enum OwnerType {
  VEHICLE = 'vehicle',
  DRIVER = 'driver',
}

export interface Certificate {
  id: string
  ownerId: string
  ownerType: OwnerType
  ownerName?: string
  certType: CertType
  certName: string
  issueDate: string
  expiryDate: string
  attachment: string | null
  remark: string | null
  isExpiringSoon: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCertificateRequest {
  ownerId: string
  ownerType: OwnerType
  certType: CertType
  certName: string
  issueDate: string
  expiryDate: string
  attachment?: File
  remark?: string
}

export interface UpdateCertificateRequest {
  certType?: CertType
  certName?: string
  issueDate?: string
  expiryDate?: string
  attachment?: File
  remark?: string
}

export interface CertificateListParams {
  ownerType?: OwnerType
  ownerId?: string
  expiringSoon?: boolean
  page?: number
  pageSize?: number
}