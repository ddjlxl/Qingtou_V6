<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useFleetStore } from '../stores/useFleetStore'
import { Ownership } from '../types/vehicle'
import type { Vehicle } from '../types/vehicle'
import { isApiError } from '@/shared/utils'

const props = defineProps<{
  visible: boolean
  vehicle: Vehicle | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const fleetStore = useFleetStore()

const formRef = ref()
const loading = ref(false)

const form = ref({
  plateNo: '',
  ownership: Ownership.OWN,
})

const rules = {
  plateNo: [
    { required: true, message: '请输入车牌号', trigger: 'blur' },
  ],
  ownership: [
    { required: true, message: '请选择归属性质', trigger: 'change' },
  ],
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.vehicle) {
        form.value.plateNo = props.vehicle.plateNo
        form.value.ownership = props.vehicle.ownership
      } else {
        form.value.plateNo = ''
        form.value.ownership = Ownership.OWN
      }
    }
  }
)

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    if (props.vehicle) {
      await fleetStore.updateVehicle(props.vehicle.id, {
        ownership: form.value.ownership,
      })
      ElMessage.success('车辆信息已更新')
    } else {
      await fleetStore.createVehicle({
        plateNo: form.value.plateNo,
        ownership: form.value.ownership,
      })
      ElMessage.success('车辆已新增')
    }
    emit('success')
    handleClose()
  } catch (err: unknown) {
    const message = isApiError(err) ? err.message : '操作失败'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="vehicle ? '编辑车辆' : '新增车辆'"
    width="480px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="车牌号" prop="plateNo">
        <el-input
          v-model="form.plateNo"
          placeholder="请输入车牌号"
          :disabled="!!vehicle"
        />
      </el-form-item>
      <el-form-item label="归属性质" prop="ownership">
        <el-select
          v-model="form.ownership"
          placeholder="请选择归属性质"
          style="width: 100%"
        >
          <el-option label="自有车辆" :value="Ownership.OWN" />
          <el-option label="外协车辆" :value="Ownership.EXTERNAL" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>