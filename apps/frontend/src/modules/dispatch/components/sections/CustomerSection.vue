<script setup lang="ts">
import { computed } from 'vue'
import type { OrderFormState } from '../../composables/useOrderForm'
import { getCustomerHistory } from '@/shared/utils/customerHistory'

const props = defineProps<{
  form: OrderFormState
  disabled: boolean
}>()

const emit = defineEmits<{
  'update:customerName': [value: string]
  'update:customerPhone': [value: string]
}>()

const customerName = computed({
  get: () => props.form.customerName,
  set: (val) => emit('update:customerName', val),
})

const customerPhone = computed({
  get: () => props.form.customerPhone,
  set: (val) => emit('update:customerPhone', val),
})

function fetchCustomerSuggestions(
  queryString: string,
  cb: (results: { value: string }[]) => void
): void {
  const history = getCustomerHistory()
  const results = history
    .filter((name) => name.toLowerCase().includes(queryString.toLowerCase()))
    .map((value) => ({ value }))
  cb(results)
}
</script>

<template>
  <el-divider content-position="left">
    客户信息
  </el-divider>
  <el-row :gutter="16">
    <el-col :span="12">
      <el-form-item label="客户名称">
        <el-autocomplete
          v-model="customerName"
          :disabled="disabled"
          :fetch-suggestions="fetchCustomerSuggestions"
          placeholder="请输入客户名称"
          clearable
        />
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="联系电话">
        <el-input
          v-model="customerPhone"
          :disabled="disabled"
          placeholder="请输入联系电话"
          clearable
        />
      </el-form-item>
    </el-col>
  </el-row>
</template>
