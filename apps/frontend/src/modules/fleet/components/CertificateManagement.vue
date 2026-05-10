<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFleetStore } from '../stores/useFleetStore'
import { OwnerType } from '../types/certificate'
import type { Certificate } from '../types/certificate'
import { isApiError } from '@/shared/utils'
import EmptyState from '@/shared/components/EmptyState.vue'
import CertificateFormDialog from './CertificateFormDialog.vue'

const fleetStore = useFleetStore()

const expiringSoonFilter = ref(false)
const dialogVisible = ref(false)
const editingCertificate = ref<Certificate | null>(null)

const certTypeLabels: Record<string, string> = {
  vehicle_license: '行驶证',
  road_transport: '道路运输证',
  compulsory_insurance: '交强险',
  commercial_insurance: '商业险',
  annual_inspection: '年审',
  driving_license: '驾驶证',
  qualification: '从业资格证',
}

function getCertTypeLabel(certType: string) {
  return certTypeLabels[certType] || certType
}

function getOwnerTypeLabel(ownerType: string) {
  return ownerType === OwnerType.VEHICLE ? '车辆' : '司机'
}

async function loadCertificates() {
  const params = expiringSoonFilter.value
    ? { expiringSoon: true }
    : undefined
  await fleetStore.fetchCertificates(params)
}

function handleExpiringSoonToggle() {
  expiringSoonFilter.value = !expiringSoonFilter.value
  loadCertificates()
}

function handleAdd() {
  editingCertificate.value = null
  dialogVisible.value = true
}

function handleEdit(cert: Certificate) {
  editingCertificate.value = cert
  dialogVisible.value = true
}

async function handleDelete(cert: Certificate) {
  try {
    await ElMessageBox.confirm(
      `确定要删除证照 ${cert.certName} 吗？删除后不可恢复。`,
      '删除确认',
      { type: 'warning' }
    )
    await fleetStore.deleteCertificate(cert.id)
    ElMessage.success('证照已删除')
  } catch (err: unknown) {
    if (err === 'cancel') return
    const message = isApiError(err) ? err.message : '删除失败'
    ElMessage.error(message)
  }
}

function handleDialogSuccess() {
  loadCertificates()
}

onMounted(() => {
  loadCertificates()
})
</script>

<template>
  <div class="certificate-management">
    <div class="toolbar">
      <el-button
        :type="expiringSoonFilter ? 'warning' : 'default'"
        @click="handleExpiringSoonToggle"
      >
        即将到期
      </el-button>
      <el-button type="primary" @click="handleAdd">新增证照</el-button>
    </div>

    <el-alert
      v-if="fleetStore.certificateError"
      :title="fleetStore.certificateError"
      type="error"
      show-icon
      closable
      class="error-alert"
    />

    <el-table
      v-loading="fleetStore.certificateLoading"
      :data="fleetStore.certificates"
      style="width: 100%"
    >
      <el-table-column prop="certType" label="证照类型" min-width="120">
        <template #default="{ row }">
          {{ getCertTypeLabel(row.certType) }}
        </template>
      </el-table-column>
      <el-table-column prop="certName" label="证照名称" min-width="120" />
      <el-table-column prop="ownerType" label="所属类型" min-width="100">
        <template #default="{ row }">
          {{ getOwnerTypeLabel(row.ownerType) }}
        </template>
      </el-table-column>
      <el-table-column prop="ownerName" label="所属对象" min-width="120">
        <template #default="{ row }">
          {{ row.ownerName || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="expiryDate" label="有效期至" min-width="120" />
      <el-table-column label="状态" min-width="100">
        <template #default="{ row }">
          <el-tag v-if="row.isExpiringSoon" type="warning" size="small">
            即将到期
          </el-tag>
          <el-tag v-else type="success" size="small">
            正常
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            type="danger"
            link
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <EmptyState
      v-if="!fleetStore.certificateLoading && fleetStore.certificates.length === 0"
      description="暂无证照数据"
    />

    <CertificateFormDialog
      v-model:visible="dialogVisible"
      :certificate="editingCertificate"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<style scoped>
.certificate-management {
  padding: 16px 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.error-alert {
  margin-bottom: 16px;
}
</style>