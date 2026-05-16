<script setup lang="ts">
import { computed } from 'vue'
import type { OrderFormState } from '../../composables/useOrderForm'
import { BusinessType, DocumentType } from '../../types/order'

const props = defineProps<{
  form: OrderFormState
  businessTypeOptions: { value: string; label: string }[]
  documentOptions: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  'update:businessType': [value: BusinessType | '']
  'update:documents': [value: DocumentType[]]
}>()

const businessType = computed({
  get: () => props.form.businessType,
  set: (val) => emit('update:businessType', val),
})

const documents = computed({
  get: () => props.form.documents,
  set: (val) => emit('update:documents', val),
})
</script>

<template>
  <el-divider content-position="left">
    业务信息
  </el-divider>
  <el-row :gutter="16">
    <el-col :span="12">
      <el-form-item label="业务类型">
        <el-select
          v-model="businessType"
          placeholder="请选择业务类型"
          clearable
          teleported
          style="width: 100%"
        >
          <el-option
            v-for="opt in businessTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="单证">
        <el-checkbox-group v-model="documents">
          <el-checkbox
            v-for="opt in documentOptions"
            :key="opt.value"
            :value="opt.value"
            :label="opt.label"
          />
        </el-checkbox-group>
      </el-form-item>
    </el-col>
  </el-row>
</template>