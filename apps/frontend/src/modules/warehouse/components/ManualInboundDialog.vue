<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useWarehouseStore } from '../stores/useWarehouseStore'

const props = defineProps<{
  visible: boolean
  zoneCode: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const store = useWarehouseStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)

interface InboundFormItem {
  containerNo: string
  containerStatus: 'heavy' | 'empty'
  customerName: string
  containerType: string
  sealNo: string
}

const form = reactive<InboundFormItem>({
  containerNo: '',
  containerStatus: 'heavy',
  customerName: '',
  containerType: '',
  sealNo: '',
})

const rules: FormRules = {
  containerNo: [
    { required: true, message: '请输入箱号', trigger: 'blur' },
    { pattern: /^[A-Z]{4}\d{7}$/, message: '箱号格式：4大写字母+7数字', trigger: 'blur' },
  ],
  containerStatus: [
    { required: true, message: '请选择箱状态', trigger: 'change' },
  ],
}

const containerTypeOptions = [
  { label: '20GP', value: '20GP' },
  { label: '40GP', value: '40GP' },
  { label: '40HQ', value: '40HQ' },
  { label: '45HQ', value: '45HQ' },
]

function handleClose() {
  emit('update:visible', false)
  resetForm()
}

function resetForm() {
  form.containerNo = ''
  form.containerStatus = 'heavy'
  form.customerName = ''
  form.containerType = ''
  form.sealNo = ''
  formRef.value?.resetFields()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await store.manualInbound(props.zoneCode, {
      containerNo: form.containerNo.toUpperCase(),
      containerStatus: form.containerStatus,
      customerName: form.customerName || undefined,
      containerType: form.containerType || undefined,
      sealNo: form.sealNo.toUpperCase() || undefined,
    })
    ElMessage.success('入库成功')
    handleClose()
  } catch (err: unknown) {
    const error = err as { message?: string }
    ElMessage.error(error.message || '入库失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="手动入库"
    width="480px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="区域">
        <el-input :model-value="zoneCode" disabled />
      </el-form-item>
      <el-form-item label="箱号" prop="containerNo">
        <el-input
          v-model="form.containerNo"
          placeholder="如：ABCD1234567"
          maxlength="11"
        />
      </el-form-item>
      <el-form-item label="箱状态" prop="containerStatus">
        <el-select v-model="form.containerStatus">
          <el-option label="重箱" value="heavy" />
          <el-option label="空箱" value="empty" />
        </el-select>
      </el-form-item>
      <el-form-item label="货主">
        <el-input v-model="form.customerName" placeholder="选填" />
      </el-form-item>
      <el-form-item label="箱型">
        <el-select
          v-model="form.containerType"
          clearable
          placeholder="选填"
        >
          <el-option
            v-for="opt in containerTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="封号">
        <el-input v-model="form.sealNo" placeholder="选填" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        确认入库
      </el-button>
    </template>
  </el-dialog>
</template>
