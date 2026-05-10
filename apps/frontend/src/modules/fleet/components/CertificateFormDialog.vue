<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useFleetStore } from '../stores/useFleetStore'
import { OwnerType, VehicleCertType, DriverCertType } from '../types/certificate'
import type { Certificate, CreateCertificateRequest, UpdateCertificateRequest } from '../types/certificate'
import { isApiError } from '@/shared/utils'

const props = defineProps<{
  visible: boolean
  certificate: Certificate | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const fleetStore = useFleetStore()

const formRef = ref()
const isEdit = ref(false)
const submitting = ref(false)

const rules = {
  ownerId: [{ required: true, message: '请输入所属对象ID', trigger: 'blur' }],
  ownerType: [{ required: true, message: '请选择所属类型', trigger: 'change' }],
  certType: [{ required: true, message: '请选择证照类型', trigger: 'change' }],
  certName: [{ required: true, message: '请输入证照名称', trigger: 'blur' }],
  issueDate: [{ required: true, message: '请选择签发日期', trigger: 'change' }],
  expiryDate: [{ required: true, message: '请选择到期日期', trigger: 'change' }],
}

const form = ref({
  ownerId: '',
  ownerType: OwnerType.VEHICLE,
  certType: VehicleCertType.VEHICLE_LICENSE as string,
  certName: '',
  issueDate: '',
  expiryDate: '',
  remark: '',
})

const vehicleCertTypeOptions = [
  { label: '行驶证', value: VehicleCertType.VEHICLE_LICENSE },
  { label: '道路运输证', value: VehicleCertType.ROAD_TRANSPORT },
  { label: '交强险', value: VehicleCertType.COMPULSORY_INSURANCE },
  { label: '商业险', value: VehicleCertType.COMMERCIAL_INSURANCE },
  { label: '年审', value: VehicleCertType.ANNUAL_INSPECTION },
]

const driverCertTypeOptions = [
  { label: '驾驶证', value: DriverCertType.DRIVING_LICENSE },
  { label: '从业资格证', value: DriverCertType.QUALIFICATION },
]

const ownerTypeOptions = [
  { label: '车辆', value: OwnerType.VEHICLE },
  { label: '司机', value: OwnerType.DRIVER },
]

const certTypeOptions = computed(() => {
  return form.value.ownerType === OwnerType.VEHICLE
    ? vehicleCertTypeOptions
    : driverCertTypeOptions
})

function resetForm() {
  form.value = {
    ownerId: '',
    ownerType: OwnerType.VEHICLE,
    certType: VehicleCertType.VEHICLE_LICENSE,
    certName: '',
    issueDate: '',
    expiryDate: '',
    remark: '',
  }
  isEdit.value = false
}

watch(
  () => form.value.ownerType,
  () => {
    form.value.certType = form.value.ownerType === OwnerType.VEHICLE
      ? VehicleCertType.VEHICLE_LICENSE
      : DriverCertType.DRIVING_LICENSE
  }
)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.certificate) {
        isEdit.value = true
        form.value = {
          ownerId: props.certificate.ownerId,
          ownerType: props.certificate.ownerType,
          certType: props.certificate.certType,
          certName: props.certificate.certName,
          issueDate: props.certificate.issueDate,
          expiryDate: props.certificate.expiryDate,
          remark: props.certificate.remark || '',
        }
      } else {
        resetForm()
      }
    }
  },
  { immediate: true }
)

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && props.certificate) {
      const data: UpdateCertificateRequest = {
        certType: form.value.certType,
        certName: form.value.certName,
        issueDate: form.value.issueDate,
        expiryDate: form.value.expiryDate,
        remark: form.value.remark || undefined,
      }
      await fleetStore.updateCertificate(props.certificate.id, data)
      ElMessage.success('证照更新成功')
    } else {
      const data: CreateCertificateRequest = {
        ownerId: form.value.ownerId,
        ownerType: form.value.ownerType as OwnerType,
        certType: form.value.certType,
        certName: form.value.certName,
        issueDate: form.value.issueDate,
        expiryDate: form.value.expiryDate,
        remark: form.value.remark || undefined,
      }
      await fleetStore.createCertificate(data)
      ElMessage.success('证照新增成功')
    }
    emit('success')
    handleClose()
  } catch (err: unknown) {
    const message = isApiError(err) ? err.message : '操作失败'
    ElMessage.error(message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="isEdit ? '编辑证照' : '新增证照'"
    width="520px"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item v-if="!isEdit" label="所属类型" prop="ownerType" required>
        <el-select
          v-model="form.ownerType"
          style="width: 100%"
        >
          <el-option
            v-for="opt in ownerTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item v-if="!isEdit" label="所属对象ID" prop="ownerId" required>
        <el-input v-model="form.ownerId" placeholder="请输入车辆或司机ID" />
      </el-form-item>

      <el-form-item label="证照类型" prop="certType" required>
        <el-select
          v-model="form.certType"
          style="width: 100%"
        >
          <el-option
            v-for="opt in certTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="证照名称" prop="certName" required>
        <el-input v-model="form.certName" placeholder="请输入证照名称" />
      </el-form-item>

      <el-form-item label="签发日期" prop="issueDate" required>
        <el-date-picker
          v-model="form.issueDate"
          type="date"
          placeholder="选择签发日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="到期日期" prop="expiryDate" required>
        <el-date-picker
          v-model="form.expiryDate"
          type="date"
          placeholder="选择到期日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>