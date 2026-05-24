<script setup lang="ts">
import { ref, toRef } from 'vue'
import { ElMessage } from 'element-plus'
import { useDispatchStore } from '../stores/useDispatchStore'
import { useOrderForm } from '../composables/useOrderForm'
import type { Order, CreateOrderRequest, UpdateOrderRequest } from '../types/order'
import AddressDialog from './AddressDialog.vue'
import BusinessSection from './sections/BusinessSection.vue'
import RouteSection from './sections/RouteSection.vue'
import ContainerSection from './sections/ContainerSection.vue'
import CustomerSection from './sections/CustomerSection.vue'
import AssignSection from './sections/AssignSection.vue'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  order?: Order | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const store = useDispatchStore()

const {
  form,
  formRules,
  containerTypeOptions,
  containerStatusOptions,
  businessTypeOptions,
  documentOptions,
  canCreateAndAssign,
  isLimitedEdit,
  dialogTitle,
  routeSummary,
  addWaypoint,
  removeWaypoint,
  onContainerNoInput,
  onSealNoInput,
  buildRequest,
} = useOrderForm({
  mode: toRef(props, 'mode'),
  order: toRef(props, 'order'),
  visible: toRef(props, 'visible'),
})

const formRef = ref()
const submitting = ref(false)
const addressDialogVisible = ref(false)

defineExpose({ form })

function openAddressDialog() {
  addressDialogVisible.value = true
}

function onAddressSelected(name: string, target: 'origin' | 'dest') {
  if (target === 'origin') {
    form.originName = name
  } else {
    form.destName = name
  }
}

async function handleCreateTask() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data = buildRequest() as CreateOrderRequest
    await store.createOrder(data)
    ElMessage.success('任务创建成功')
    emit('update:visible', false)
    emit('success')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '创建任务失败，请重试')
  } finally {
    submitting.value = false
  }
}

async function handleCreateAndAssign() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data: CreateOrderRequest = {
      ...buildRequest(),
      driverId: form.driverId,
      vehicleId: form.vehicleId,
    }
    await store.createOrder(data)
    ElMessage.success('任务创建并派车成功')
    emit('update:visible', false)
    emit('success')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '创建任务失败，请重试')
  } finally {
    submitting.value = false
  }
}

async function handleUpdate() {
  if (!props.order) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const data = buildRequest() as UpdateOrderRequest
    await store.updateOrder(props.order.id, data)
    ElMessage.success('任务编辑成功')
    emit('update:visible', false)
    emit('success')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '编辑任务失败，请重试')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="100px"
    >
      <BusinessSection
        :form="form"
        :disabled="isLimitedEdit"
        :business-type-options="businessTypeOptions"
        :document-options="documentOptions"
        @update:business-type="form.businessType = $event"
        @update:documents="form.documents = $event"
      />

      <RouteSection
        :form="form"
        :disabled="isLimitedEdit"
        :route-summary="routeSummary"
        @add-waypoint="addWaypoint"
        @remove-waypoint="removeWaypoint"
        @open-address-dialog="openAddressDialog"
        @update:origin-name="form.originName = $event"
        @update:dest-name="form.destName = $event"
        @update:waypoint="(index: number, val: string) => form.waypoints[index] = val"
      />

      <ContainerSection
        :form="form"
        :disabled="isLimitedEdit"
        :container-type-options="containerTypeOptions"
        :container-status-options="containerStatusOptions"
        @container-no-input="onContainerNoInput"
        @seal-no-input="onSealNoInput"
        @update:container-type="form.containerType = $event"
        @update:container-status="form.containerStatus = $event"
      />

      <CustomerSection
        :form="form"
        :disabled="isLimitedEdit"
        @update:customer-name="form.customerName = $event"
        @update:customer-phone="form.customerPhone = $event"
      />

      <template v-if="mode === 'create'">
        <AssignSection
          :form="form"
          :available-drivers="store.availableDrivers"
          :available-vehicles="store.availableVehicles"
          @update:driver-id="form.driverId = $event"
          @update:vehicle-id="form.vehicleId = $event"
        />
      </template>

      <el-divider content-position="left">
        备注
      </el-divider>
      <el-form-item label="调度备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          :disabled="isLimitedEdit"
          placeholder="请输入备注信息"
          clearable
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="order-form__footer">
        <el-button @click="handleClose">
          取消
        </el-button>
        <template v-if="mode === 'create'">
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleCreateTask"
          >
            创建任务
          </el-button>
          <el-tooltip
            :disabled="canCreateAndAssign"
            content="请选择司机和车辆"
            placement="top"
          >
            <el-button
              type="success"
              :loading="submitting"
              :disabled="!canCreateAndAssign"
              @click="handleCreateAndAssign"
            >
              创建并派车
            </el-button>
          </el-tooltip>
        </template>
        <template v-else>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleUpdate"
          >
            保存
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>

  <AddressDialog
    v-model:visible="addressDialogVisible"
    @select="onAddressSelected"
  />
</template>

<style scoped>
.order-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>