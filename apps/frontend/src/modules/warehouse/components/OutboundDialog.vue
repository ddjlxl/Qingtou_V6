<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useWarehouseStore } from '../stores/useWarehouseStore'
import type { Slot } from '../types'

const props = defineProps<{
  visible: boolean
  selectedSlots: Slot[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const store = useWarehouseStore()
const submitting = ref(false)
const businessType = ref('')

const businessTypeOptions = [
  { label: '重箱运输', value: 'heavy_transport' },
  { label: '空箱运输', value: 'empty_transport' },
  { label: '短驳', value: 'short_haul' },
]

function handleClose() {
  emit('update:visible', false)
}

async function handleSubmit() {
  submitting.value = true
  try {
    await store.outbound(
      props.selectedSlots.map((s) => s.id),
      businessType.value || undefined,
    )
    ElMessage.success('出库成功')
    handleClose()
  } catch (err: unknown) {
    const error = err as { message?: string }
    ElMessage.error(error.message || '出库失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="确认出库"
    width="520px"
    @close="handleClose"
  >
    <div class="outbound-content">
      <p class="outbound-content__hint">
        以下 {{ selectedSlots.length }} 个库位将出库，出库后自动创建调度任务：
      </p>
      <el-table
        :data="selectedSlots"
        size="small"
        max-height="240"
      >
        <el-table-column
          prop="zoneCode"
          label="区域"
          width="80"
        />
        <el-table-column
          prop="slotNo"
          label="库位"
          width="80"
        />
        <el-table-column
          prop="containerNo"
          label="箱号"
        />
        <el-table-column
          prop="containerStatus"
          label="状态"
          width="60"
        >
          <template #default="{ row }">
            {{ row.containerStatus === 'heavy' ? '重箱' : '空箱' }}
          </template>
        </el-table-column>
      </el-table>
      <el-form
        label-width="80px"
        style="margin-top: 16px"
      >
        <el-form-item label="业务类型">
          <el-select
            v-model="businessType"
            clearable
            placeholder="选填"
          >
            <el-option
              v-for="opt in businessTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="danger"
        :loading="submitting"
        @click="handleSubmit"
      >
        确认出库
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.outbound-content__hint {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
}
</style>
