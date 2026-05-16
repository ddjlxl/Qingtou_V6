<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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
  boundDriverId: null as string | null,
})

const rules = {
  plateNo: [
    { required: true, message: '请输入车牌号', trigger: 'change' },
  ],
  ownership: [
    { required: true, message: '请选择归属性质', trigger: 'change' },
  ],
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      fleetStore.fetchDrivers()
      if (props.vehicle) {
        form.value.plateNo = props.vehicle.plateNo
        form.value.ownership = props.vehicle.ownership
        form.value.boundDriverId = props.vehicle.boundDriverId ?? null
      } else {
        form.value.plateNo = ''
        form.value.ownership = Ownership.OWN
        form.value.boundDriverId = null
      }
      nextTick(() => {
        formRef.value?.clearValidate()
      })
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

  loading.value = true
  try {
    if (props.vehicle) {
      await fleetStore.updateVehicle(props.vehicle.id, {
        ownership: form.value.ownership,
      })

      const currentDriverId = props.vehicle.boundDriverId ?? null
      const newDriverId = form.value.boundDriverId
      if (newDriverId !== currentDriverId) {
        await bindDriverWithConfirm(props.vehicle.id, newDriverId)
      }

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
    if (err === 'cancel') return
    const message = isApiError(err) ? err.message : '操作失败'
    ElMessage.error(message)
  } finally {
    loading.value = false
  }
}

async function bindDriverWithConfirm(vehicleId: string, driverId: string | null) {
  const result = await fleetStore.bindDriverToVehicle(vehicleId, driverId ?? '', false)

  if (result.needConfirm) {
    try {
      await ElMessageBox.confirm(
        result.message,
        '更换关联确认',
        { type: 'warning' }
      )
    } catch {
      throw 'cancel'
    }
    await fleetStore.bindDriverToVehicle(vehicleId, driverId ?? '', true)
  }
}

defineExpose({ form, formRef, handleSubmit })
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
      <el-form-item
        label="车牌号"
        prop="plateNo"
      >
        <el-input
          v-model="form.plateNo"
          placeholder="请输入车牌号"
          :disabled="!!vehicle"
        />
      </el-form-item>
      <el-form-item
        label="归属性质"
        prop="ownership"
      >
        <el-select
          v-model="form.ownership"
          placeholder="请选择归属性质"
          style="width: 100%"
        >
          <el-option
            label="自有车辆"
            :value="Ownership.OWN"
          />
          <el-option
            label="外协车辆"
            :value="Ownership.EXTERNAL"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="vehicle"
        label="关联司机"
        prop="boundDriverId"
      >
        <el-select
          v-model="form.boundDriverId"
          placeholder="请选择司机"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="driver in fleetStore.drivers"
            :key="driver.id"
            :label="driver.name"
            :value="driver.id"
            :disabled="driver.isDisabled"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
