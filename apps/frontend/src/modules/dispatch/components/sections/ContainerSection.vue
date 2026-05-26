<script setup lang="ts">
import { computed } from 'vue'
import type { OrderFormState } from '../../composables/useOrderForm'
import { ContainerType, ContainerStatus } from '../../types/order'

const props = defineProps<{
  form: OrderFormState
  disabled: boolean
  containerTypeOptions: { value: string; label: string }[]
  containerStatusOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  containerNoInput: [val: string]
  sealNoInput: [val: string]
  'update:containerType': [value: ContainerType | '']
  'update:containerStatus': [value: ContainerStatus | '']
}>()

const containerType = computed({
  get: () => props.form.containerType,
  set: (val) => emit('update:containerType', val),
})

const containerStatus = computed({
  get: () => props.form.containerStatus,
  set: (val) => emit('update:containerStatus', val),
})
</script>

<template>
  <el-divider content-position="left">
    集装箱信息
  </el-divider>
  <el-row :gutter="16">
    <el-col :span="12">
      <el-form-item
        label="箱号"
        style="max-width: 300px"
      >
        <el-input
          :model-value="form.containerNo"
          placeholder="4位字母+7位数字"
          clearable
          @input="emit('containerNoInput', $event)"
        />
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item
        label="空重箱"
        prop="containerStatus"
        style="max-width: 300px"
      >
        <el-select
          v-model="containerStatus"
          :disabled="disabled"
          placeholder="请选择"
          clearable
          teleported
          style="width: 100%"
        >
          <el-option
            v-for="opt in containerStatusOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
    </el-col>
  </el-row>
  <el-row :gutter="16">
    <el-col :span="12">
      <el-form-item
        label="箱型"
        style="max-width: 300px"
      >
        <el-select
          v-model="containerType"
          :disabled="disabled"
          placeholder="请选择箱型"
          clearable
          teleported
          style="width: 100%"
        >
          <el-option
            v-for="opt in containerTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item
        label="封号"
        style="max-width: 300px"
      >
        <el-input
          :model-value="form.sealNo"
          placeholder="请输入封号"
          clearable
          @input="emit('sealNoInput', $event)"
        />
      </el-form-item>
    </el-col>
  </el-row>
</template>