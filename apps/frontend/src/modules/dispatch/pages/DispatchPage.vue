<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDispatchStore } from '../stores/useDispatchStore'
import OrderTable from '../components/OrderTable.vue'
import OrderFormDialog from '../components/OrderFormDialog.vue'
import AssignDialog from '../components/AssignDialog.vue'
import RouteTemplateDialog from '../components/RouteTemplateDialog.vue'
import type { Order } from '../types/order'

const store = useDispatchStore()

const formDialogVisible = ref(false)
const formDialogMode = ref<'create' | 'edit'>('create')
const editingOrder = ref<Order | null>(null)

const assignDialogVisible = ref(false)
const assigningOrder = ref<Order | null>(null)
const routeTemplateDialogVisible = ref(false)

onMounted(() => {
  store.fetchOrders()
})

function handleCreate() {
  formDialogMode.value = 'create'
  editingOrder.value = null
  formDialogVisible.value = true
}

function handleEdit(order: Order) {
  formDialogMode.value = 'edit'
  editingOrder.value = order
  formDialogVisible.value = true
}

function handleAssign(order: Order) {
  assigningOrder.value = order
  assignDialogVisible.value = true
}

async function handleComplete(order: Order) {
  try {
    await ElMessageBox.confirm(
      '确定将该任务标记为已完成吗？',
      '确认操作',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    await store.completeOrder(order.id)
    ElMessage.success('已标记为完成')
  } catch {
    // cancelled
  }
}

async function handleDelete(order: Order) {
  try {
    await store.deleteOrder(order.id)
    ElMessage.success('任务已删除')
  } catch {
    // error handled by store
  }
}

function handleFormSuccess() {
  store.fetchOrders()
}
</script>

<template>
  <div class="dispatch-page">
    <div class="dispatch-page__header">
      <h2 class="dispatch-page__title">
        调度中心
      </h2>
      <el-button @click="routeTemplateDialogVisible = true">
        路线模板
      </el-button>
    </div>

    <OrderTable
      @create="handleCreate"
      @edit="handleEdit"
      @assign="handleAssign"
      @complete="handleComplete"
      @delete="handleDelete"
    />

    <OrderFormDialog
      v-model:visible="formDialogVisible"
      :mode="formDialogMode"
      :order="editingOrder"
      @success="handleFormSuccess"
    />

    <AssignDialog
      v-model:visible="assignDialogVisible"
      :order="assigningOrder"
      @success="store.fetchOrders()"
    />

    <RouteTemplateDialog v-model:visible="routeTemplateDialogVisible" />
  </div>
</template>

<style scoped>
.dispatch-page {
  padding: 20px;
}

.dispatch-page__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.dispatch-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
</style>