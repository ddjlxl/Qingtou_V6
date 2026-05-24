<script setup lang="ts">
import { computed } from 'vue'
import type { OrderFormState } from '../../composables/useOrderForm'

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
</script>

<template>
  <el-divider content-position="left">
    客户信息
  </el-divider>
  <el-row :gutter="16">
    <el-col :span="12">
      <el-form-item label="客户名称">
        <el-input
          v-model="customerName"
          :disabled="disabled"
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