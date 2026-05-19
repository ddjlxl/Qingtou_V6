<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useFleetStore } from '../stores/useFleetStore'
import type { Driver } from '../types/driver'
import { isApiError } from '@/shared/utils'

const props = defineProps<{
  visible: boolean
  driver: Driver | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const fleetStore = useFleetStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = ref({
  name: '',
  phone: '',
  boundVehicleId: null as string | null,
})

const rules = {
  name: [
    { required: true, message: '请输入司机姓名', trigger: 'change' },
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'change' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确', trigger: 'change' },
  ],
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      fleetStore.fetchVehicles()
      if (props.driver) {
        form.value.name = props.driver.name
        form.value.phone = props.driver.phone
        form.value.boundVehicleId = props.driver.boundVehicleId ?? null
      } else {
        form.value.name = ''
        form.value.phone = ''
        form.value.boundVehicleId = null
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
    if (props.driver) {
      await fleetStore.updateDriver(props.driver.id, {
        name: form.value.name,
        phone: form.value.phone,
      })

      const currentVehicleId = props.driver.boundVehicleId ?? null
      const newVehicleId = form.value.boundVehicleId
      if (newVehicleId !== currentVehicleId) {
        if (newVehicleId) {
          await bindDriverWithConfirm(props.driver.id, newVehicleId)
        } else {
          await fleetStore.bindDriverToVehicle(currentVehicleId!, '', false)
        }
      }

      ElMessage.success('司机信息已更新')
    } else {
      await fleetStore.createDriver({
        name: form.value.name,
        phone: form.value.phone,
      })
      ElMessage.success('司机已新增')
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

async function bindDriverWithConfirm(driverId: string, vehicleId: string) {
  const result = await fleetStore.bindDriverToVehicle(vehicleId, driverId, false)

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
    await fleetStore.bindDriverToVehicle(vehicleId, driverId, true)
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="driver ? '编辑司机' : '新增司机'"
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
        label="姓名"
        prop="name"
      >
        <el-input
          v-model="form.name"
          placeholder="请输入司机姓名"
        />
      </el-form-item>
      <el-form-item
        label="手机号"
        prop="phone"
      >
        <el-input
          v-model="form.phone"
          placeholder="请输入手机号"
        />
      </el-form-item>
      <el-form-item
        v-if="driver"
        label="关联车辆"
        prop="boundVehicleId"
      >
        <el-select
          v-model="form.boundVehicleId"
          placeholder="请选择车辆"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="vehicle in fleetStore.vehicles"
            :key="vehicle.id"
            :label="vehicle.plateNo"
            :value="vehicle.id"
            :disabled="vehicle.isDisabled"
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
