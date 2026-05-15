<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useDispatchStore } from '../stores/useDispatchStore'
import { dispatchService } from '../services/dispatchService'
import {
  BusinessType,
  DocumentType,
  ContainerType,
} from '../types/order'
import type { Order, CreateOrderRequest, UpdateOrderRequest } from '../types/order'
import AddressDialog from './AddressDialog.vue'

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

const formRef = ref()
const submitting = ref(false)
const addressDialogVisible = ref(false)

const form = reactive({
  customerName: '',
  customerPhone: '',
  originName: '',
  destName: '',
  waypoints: [] as string[],
  containerNo: '',
  containerType: '' as ContainerType | '',
  sealNo: '',
  businessType: '' as BusinessType | '',
  documents: [] as DocumentType[],
  driverId: '',
  vehicleId: '',
  remark: '',
})

const containerTypeOptions = [
  { value: ContainerType.GP20, label: '20GP' },
  { value: ContainerType.GP40, label: '40GP' },
  { value: ContainerType.HQ40, label: '40HQ' },
  { value: ContainerType.HQ45, label: '45HQ' },
]

const businessTypeOptions = [
  { value: BusinessType.HEAVY_TRANSPORT, label: '重箱运输' },
  { value: BusinessType.EMPTY_TRANSPORT, label: '空箱运输' },
  { value: BusinessType.SHORT_HAUL, label: '短驳' },
]

const documentOptions = [
  { value: DocumentType.PICKUP_ORDER, label: '提箱单' },
  { value: DocumentType.WEIGHING, label: '过磅' },
  { value: DocumentType.RECTIFICATION, label: '整改' },
]

const canCreateAndAssign = computed(() => {
  return form.driverId !== '' && form.vehicleId !== ''
})

const isEditMode = computed(() => props.mode === 'edit')

const dialogTitle = computed(() => {
  return isEditMode.value ? '编辑任务' : '新建任务'
})

const routeSummary = computed(() => {
  const parts: string[] = []
  if (form.originName) parts.push(form.originName)
  const validWaypoints = form.waypoints.filter((w) => w.trim())
  if (validWaypoints.length > 0) parts.push(...validWaypoints)
  if (form.destName) parts.push(form.destName)
  return parts.length > 0 ? parts.join(' → ') : ''
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.mode === 'edit' && props.order) {
        fillFormFromOrder(props.order)
      } else {
        resetForm()
      }
      store.fetchAvailableResources()
    }
  }
)

watch(
  () => form.businessType,
  async (val) => {
    if (!val || props.mode !== 'create') return
    try {
      const result = await dispatchService.getRouteTemplate(val)
      if (result.originName) {
        form.originName = result.originName
      }
      form.waypoints = result.waypoints ? [...result.waypoints] : []
      if (result.destName) {
        form.destName = result.destName
      }
    } catch {
      // 无模板数据，忽略
    }
  }
)

watch(
  () => form.vehicleId,
  (val) => {
    if (val && props.mode === 'create') {
      const vehicle = store.availableVehicles.find((v) => v.id === val)
      if (vehicle?.boundDriverName) {
        const driver = store.availableDrivers.find(
          (d) => d.name === vehicle.boundDriverName
        )
        if (driver) {
          form.driverId = driver.id
        }
      }
    }
  }
)

watch(
  () => form.driverId,
  (val) => {
    if (val && props.mode === 'create') {
      const driver = store.availableDrivers.find((d) => d.id === val)
      if (driver?.boundVehiclePlateNo) {
        const vehicle = store.availableVehicles.find(
          (v) => v.plateNo === driver.boundVehiclePlateNo
        )
        if (vehicle) {
          form.vehicleId = vehicle.id
        }
      }
    }
  }
)

function fillFormFromOrder(order: Order) {
  form.customerName = order.customerName || ''
  form.customerPhone = order.customerPhone || ''
  form.originName = order.originName || ''
  form.destName = order.destName || ''
  form.waypoints = order.waypoints || []
  form.containerNo = order.containerNo || ''
  form.containerType = (order.containerType as ContainerType) || ''
  form.sealNo = order.sealNo || ''
  form.businessType = (order.businessType as BusinessType) || ''
  form.documents = order.documents || []
  form.remark = order.remark || ''
  form.driverId = ''
  form.vehicleId = ''
}

function resetForm() {
  form.customerName = ''
  form.customerPhone = ''
  form.originName = ''
  form.destName = ''
  form.waypoints = []
  form.containerNo = ''
  form.containerType = ''
  form.sealNo = ''
  form.businessType = ''
  form.documents = []
  form.driverId = ''
  form.vehicleId = ''
  form.remark = ''
}

function addWaypoint() {
  form.waypoints.push('')
}

function removeWaypoint(index: number) {
  form.waypoints.splice(index, 1)
}

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

function onContainerNoInput(val: string) {
  form.containerNo = val.toUpperCase()
}

function onSealNoInput(val: string) {
  form.sealNo = val.toUpperCase()
}

function buildRequest(): CreateOrderRequest | UpdateOrderRequest {
  return {
    customerName: form.customerName || undefined,
    customerPhone: form.customerPhone || undefined,
    originName: form.originName || undefined,
    destName: form.destName || undefined,
    waypoints: form.waypoints.filter((w) => w.trim()).length > 0
      ? form.waypoints.filter((w) => w.trim())
      : undefined,
    containerNo: form.containerNo || undefined,
    containerType: (form.containerType as ContainerType) || undefined,
    sealNo: form.sealNo || undefined,
    businessType: (form.businessType as BusinessType) || undefined,
    documents: form.documents.length > 0 ? form.documents : undefined,
    remark: form.remark || undefined,
  }
}

async function handleCreateTask() {
  submitting.value = true
  try {
    const data = buildRequest() as CreateOrderRequest
    await store.createOrder(data)
    ElMessage.success('任务创建成功')
    emit('update:visible', false)
    emit('success')
  } catch {
    // error handled by store
  } finally {
    submitting.value = false
  }
}

async function handleCreateAndAssign() {
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
  } catch {
    // error handled by store
  } finally {
    submitting.value = false
  }
}

async function handleUpdate() {
  if (!props.order) return
  submitting.value = true
  try {
    const data = buildRequest() as UpdateOrderRequest
    await store.updateOrder(props.order.id, data)
    ElMessage.success('任务编辑成功')
    emit('update:visible', false)
    emit('success')
  } catch {
    // error handled by store
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
      label-width="100px"
    >
      <el-divider content-position="left">
        业务信息
      </el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="业务类型">
            <el-select
              v-model="form.businessType"
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
            <el-checkbox-group v-model="form.documents">
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

      <el-divider content-position="left">
        路线规划
      </el-divider>
      <el-row :gutter="16">
        <el-col :span="14">
          <el-form-item label="起运地">
            <el-input
              v-model="form.originName"
              placeholder="请输入起运地"
              clearable
            >
              <template #append>
                <el-button @click="openAddressDialog()">
                  常用
                </el-button>
              </template>
            </el-input>
          </el-form-item>

          <div class="order-form__waypoints">
            <div
              v-for="(_, index) in form.waypoints"
              :key="index"
              class="order-form__waypoint-item"
            >
              <el-form-item :label="`途径点${index + 1}`">
                <el-input
                  v-model="form.waypoints[index]"
                  placeholder="请输入途径点"
                >
                  <template #append>
                    <el-button
                      type="danger"
                      :icon="'Delete'"
                      @click="removeWaypoint(index)"
                    />
                  </template>
                </el-input>
              </el-form-item>
            </div>
            <el-button
              type="primary"
              link
              @click="addWaypoint"
            >
              + 添加途径点
            </el-button>
          </div>

          <el-form-item label="目的地">
            <el-input
              v-model="form.destName"
              placeholder="请输入目的地"
              clearable
            >
              <template #append>
                <el-button @click="openAddressDialog()">
                  常用
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="10">
          <el-card
            shadow="never"
            class="order-form__route-summary"
          >
            <template #header>
              <span>路线预览</span>
            </template>
            <p
              v-if="routeSummary"
              class="order-form__route-text"
            >
              {{ routeSummary }}
            </p>
            <p
              v-else
              class="order-form__route-placeholder"
            >
              填写起运地和目的地后自动生成
            </p>
          </el-card>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        集装箱信息
      </el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="箱号">
            <el-input
              :model-value="form.containerNo"
              placeholder="4位字母+7位数字"
              clearable
              @input="onContainerNoInput"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="箱型">
            <el-select
              v-model="form.containerType"
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
        <el-col :span="8">
          <el-form-item label="封号">
            <el-input
              :model-value="form.sealNo"
              placeholder="请输入封号"
              clearable
              @input="onSealNoInput"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        客户信息
      </el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="客户名称">
            <el-input
              v-model="form.customerName"
              placeholder="请输入客户名称"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话">
            <el-input
              v-model="form.customerPhone"
              placeholder="请输入联系电话"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <template v-if="mode === 'create'">
        <el-divider content-position="left">
          资源分配（创建并派车时选择）
        </el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="司机">
              <el-select
                v-model="form.driverId"
                placeholder="请选择司机"
                clearable
                filterable
                teleported
                style="width: 100%"
              >
                <el-option
                  v-for="d in store.availableDrivers"
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
                v-model="form.vehicleId"
                placeholder="请选择车辆"
                clearable
                filterable
                teleported
                style="width: 100%"
              >
                <el-option
                  v-for="v in store.availableVehicles"
                  :key="v.id"
                  :label="v.plateNo"
                  :value="v.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <el-divider content-position="left">
        备注
      </el-divider>
      <el-form-item label="调度备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
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
.order-form__waypoints {
  margin-bottom: 18px;
}

.order-form__waypoint-item {
  margin-bottom: 0;
}

.order-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.order-form__route-summary {
  background: #f5f7fa;
}

.order-form__route-text {
  margin: 0;
  font-size: 14px;
  color: #303133;
  word-break: break-all;
}

.order-form__route-placeholder {
  margin: 0;
  font-size: 13px;
  color: #c0c4cc;
}
</style>