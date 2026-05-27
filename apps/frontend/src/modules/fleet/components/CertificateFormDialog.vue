<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useFleetStore } from '../stores/useFleetStore'
import { OwnerType, VehicleCertType, DriverCertType } from '../types/certificate'
import type { Certificate, CreateCertificateRequest, UpdateCertificateRequest, CertType } from '../types/certificate'
import { isApiError } from '@/shared/utils'
import { rules, vehicleCertTypeOptions, driverCertTypeOptions, ownerTypeOptions } from './certificateFormConfig'

const props = defineProps<{
  visible: boolean
  certificate: Certificate | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:model-value': [value: boolean]
  success: []
}>()

const fleetStore = useFleetStore()

const formRef = ref()
const isEdit = ref(false)
const submitting = ref(false)

const form = ref({
  ownerId: '',
  ownerType: OwnerType.VEHICLE,
  certType: VehicleCertType.VEHICLE_LICENSE as string,
  certName: '',
  issueDate: '',
  expiryDate: '',
  remark: '',
})

const certTypeOptions = computed(() => {
  return form.value.ownerType === OwnerType.VEHICLE
    ? vehicleCertTypeOptions
    : driverCertTypeOptions
})

const ownerOptions = computed(() => {
  if (form.value.ownerType === OwnerType.VEHICLE) {
    return fleetStore.vehicles
      .filter((v) => !v.isDisabled)
      .map((v) => ({ label: v.plateNo, value: v.id }))
  }
  return fleetStore.drivers
    .filter((d) => !d.isDisabled)
    .map((d) => ({ label: d.name, value: d.id }))
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
    form.value.ownerId = ''
    form.value.certType = form.value.ownerType === OwnerType.VEHICLE
      ? VehicleCertType.VEHICLE_LICENSE
      : DriverCertType.DRIVING_LICENSE
  }
)

watch(
  () => form.value.certType,
  (newType) => {
    const matched = certTypeOptions.value.find((opt) => opt.value === newType)
    if (matched) {
      form.value.certName = matched.label
    }
  }
)

watch(
  () => props.visible,
  (val) => {
    if (val) {
      fleetStore.fetchVehicles()
      fleetStore.fetchDrivers()
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
      nextTick(() => {
        formRef.value?.clearValidate()
      })
    }
  },
  { immediate: true }
)

defineExpose({ form, ownerOptions })

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
        certType: form.value.certType as CertType,
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
        certType: form.value.certType as CertType,
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
      <el-form-item
        v-if="!isEdit"
        label="所属类型"
        prop="ownerType"
        required
      >
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

      <el-form-item
        v-if="!isEdit"
        label="所属对象"
        prop="ownerId"
        required
      >
        <el-select
          v-model="form.ownerId"
          placeholder="请选择所属对象"
          style="width: 100%"
          filterable
        >
          <el-option
            v-for="opt in ownerOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        label="证照类型"
        prop="certType"
        required
      >
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

      <el-form-item
        label="证照名称"
        prop="certName"
        required
      >
        <el-input
          v-model="form.certName"
          placeholder="请输入证照名称"
        />
      </el-form-item>

      <el-form-item
        label="签发日期"
        prop="issueDate"
        required
      >
        <el-date-picker
          v-model="form.issueDate"
          type="date"
          placeholder="选择签发日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>

      <el-form-item
        label="到期日期"
        prop="expiryDate"
        required
      >
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
      <el-button @click="handleClose">
        取消
      </el-button>
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