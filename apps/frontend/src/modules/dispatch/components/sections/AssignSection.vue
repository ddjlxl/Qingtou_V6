<script setup lang="ts">
import { computed } from 'vue'
import type { OrderFormState } from '../../composables/useOrderForm'
import type { AvailableDriver, AvailableVehicle } from '../../types/order'

const props = defineProps<{
  form: OrderFormState
  availableDrivers: AvailableDriver[]
  availableVehicles: AvailableVehicle[]
}>()

const emit = defineEmits<{
  'update:driverId': [value: string]
  'update:vehicleId': [value: string]
}>()

const driverId = computed({
  get: () => props.form.driverId,
  set: (val) => emit('update:driverId', val),
})

const vehicleId = computed({
  get: () => props.form.vehicleId,
  set: (val) => emit('update:vehicleId', val),
})
</script>

<template>
  <el-divider content-position="left">
    资源分配（创建并派车时选择）
  </el-divider>
  <el-row :gutter="16">
    <el-col :span="12">
      <el-form-item label="司机">
        <el-select
          v-model="driverId"
          placeholder="请选择司机"
          clearable
          filterable
          teleported
          style="width: 100%"
        >
          <el-option
            v-for="d in availableDrivers"
            :key="d.id"
            :label="`${d.name}（${d.phone}）`"
            :value="d.id"
          />
        </el-select>
      </el-form-item>
    </el-col>
    <el-col :span="12">
      <el-form-item label="车辆">
        <el-select
          v-model="vehicleId"
          placeholder="请选择车辆"
          clearable
          filterable
          teleported
          style="width: 100%"
        >
          <el-option
            v-for="v in availableVehicles"
            :key="v.id"
            :label="v.plateNo"
            :value="v.id"
          />
        </el-select>
      </el-form-item>
    </el-col>
  </el-row>
</template>