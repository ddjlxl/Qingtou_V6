import { OwnerType, VehicleCertType, DriverCertType } from '../types/certificate'

export const rules = {
  ownerId: [{ required: true, message: '请选择所属对象', trigger: 'change' }],
  ownerType: [{ required: true, message: '请选择所属类型', trigger: 'change' }],
  certType: [{ required: true, message: '请选择证照类型', trigger: 'change' }],
  certName: [{ required: true, message: '请输入证照名称', trigger: 'change' }],
  issueDate: [{ required: true, message: '请选择签发日期', trigger: 'change' }],
  expiryDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
}

export const vehicleCertTypeOptions = [
  { label: '行驶证', value: VehicleCertType.VEHICLE_LICENSE },
  { label: '道路运输证', value: VehicleCertType.ROAD_TRANSPORT },
  { label: '交强险', value: VehicleCertType.COMPULSORY_INSURANCE },
  { label: '商业险', value: VehicleCertType.COMMERCIAL_INSURANCE },
  { label: '年审', value: VehicleCertType.ANNUAL_INSPECTION },
]

export const driverCertTypeOptions = [
  { label: '驾驶证', value: DriverCertType.DRIVING_LICENSE },
  { label: '从业资格证', value: DriverCertType.QUALIFICATION },
]

export const ownerTypeOptions = [
  { label: '车辆', value: OwnerType.VEHICLE },
  { label: '司机', value: OwnerType.DRIVER },
]