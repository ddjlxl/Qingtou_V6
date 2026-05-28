<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { useWarehouseStore } from '../stores/useWarehouseStore'

const props = defineProps<{
  visible: boolean
  zoneCode: string | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const store = useWarehouseStore()
const uploading = ref(false)

function handleClose() {
  emit('update:visible', false)
}

async function handleUpload(uploadFile: UploadFile) {
  const raw = uploadFile.raw
  if (!raw) return

  if (!raw.name.endsWith('.xlsx')) {
    ElMessage.error('仅支持 .xlsx 文件')
    return
  }

  uploading.value = true
  try {
    const result = await store.importInbound(props.zoneCode, raw)
    if (result.errors.length > 0) {
      ElMessage.warning(`入库完成，${result.storedCount} 条成功，${result.errors.length} 条失败`)
    } else {
      ElMessage.success(`成功入库 ${result.storedCount} 条`)
    }
    handleClose()
  } catch (err: unknown) {
    const error = err as { message?: string }
    ElMessage.error(error.message || '导入失败')
  } finally {
    uploading.value = false
  }
}

function handleExceed() {
  ElMessage.warning('只能上传一个文件，请先移除已有文件')
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="导入入库"
    width="480px"
    @close="handleClose"
  >
    <div class="import-content">
      <p class="import-content__hint">
        上传 .xlsx 文件，系统自动分配库位。表头：箱号、箱状态(heavy/empty,可选)、货主、箱型、封号
      </p>
      <el-upload
        :auto-upload="false"
        :limit="1"
        :on-exceed="handleExceed"
        accept=".xlsx"
        drag
        @change="handleUpload"
      >
        <el-icon class="el-icon--upload">
          <upload-filled />
        </el-icon>
        <div class="el-upload__text">
          拖拽文件到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持 .xlsx 文件
          </div>
        </template>
      </el-upload>
    </div>
    <template #footer>
      <el-button @click="handleClose">
        关闭
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.import-content__hint {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}
</style>
