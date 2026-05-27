<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useWarehouseStore } from '../stores/useWarehouseStore'
import type { Slot } from '../types'

const props = defineProps<{
  visible: boolean
  slotData: Slot | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const store = useWarehouseStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const customerName = ref('')
const remark = ref('')

watch(
  () => props.visible,
  (val) => {
    if (val && props.slotData) {
      customerName.value = props.slotData.customerName || ''
      remark.value = props.slotData.remark || ''
    }
  },
)

defineExpose({ formRef, handleSubmit })

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  if (!props.slotData) return

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await store.updateSlot(props.slotData.id, {
      customerName: customerName.value || undefined,
      remark: remark.value || undefined,
    })
    ElMessage.success('更新成功')
    handleClose()
  } catch (err: unknown) {
    const error = err as { message?: string }
    ElMessage.error(error.message || '更新失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="编辑库位"
    width="400px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      label-width="60px"
    >
      <el-form-item label="库位">
        <el-input
          :model-value="slotData?.slotNo"
          disabled
        />
      </el-form-item>
      <el-form-item label="箱号">
        <el-input
          :model-value="slotData?.containerNo"
          disabled
        />
      </el-form-item>
      <el-form-item label="货主">
        <el-input
          v-model="customerName"
          placeholder="选填"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="remark"
          type="textarea"
          :rows="2"
          placeholder="选填"
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
        保存
      </el-button>
    </template>
  </el-dialog>
</template>
