<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { ArrowRight, MoreFilled } from '@element-plus/icons-vue'
import type { Order } from '../types/order'
import {
  statusTagConfig,
  documentLabels,
  formatRoute,
  formatDateTime,
  canEdit,
  canAssign,
  canComplete,
  needsDeleteConfirm,
  getDeleteConfirmMessage,
} from './useOrderTable'

defineProps<{
  orders: Order[]
  tableMaxHeight?: string
}>()

const emit = defineEmits<{
  edit: [order: Order]
  assign: [order: Order]
  complete: [order: Order]
  delete: [order: Order]
}>()

async function handleDelete(order: Order) {
  if (needsDeleteConfirm(order)) {
    try {
      await ElMessageBox.confirm(
        getDeleteConfirmMessage(order),
        '确认操作',
        { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
      )
      emit('delete', order)
    } catch {
      // cancelled
    }
  } else {
    emit('delete', order)
  }
}
</script>

<template>
  <el-table
    :data="orders"
    stripe
    style="width: 100%"
    :max-height="tableMaxHeight"
    :row-style="{ height: '45px' }"
    :cell-style="{ padding: '2px 0' }"
    :header-cell-style="{ height: '40px', padding: '2px 0' }"
  >
    <el-table-column
      prop="orderNo"
      label="任务编号"
      width="150"
      align="center"
    />
    <el-table-column
      label="客户名称"
      min-width="60"
      align="center"
    >
      <template #default="{ row }">
        {{ row.customerName || '-' }}
      </template>
    </el-table-column>
    <el-table-column
      label="路线"
      min-width="180"
      align="center"
    >
      <template #default="{ row }">
        <template v-if="formatRoute(row).origin || formatRoute(row).dest">
          <span class="order-table-body__route">
            <span
              v-if="formatRoute(row).origin"
              class="order-table-body__route-origin"
            >{{ formatRoute(row).origin }}</span>
            <template v-if="formatRoute(row).waypoints.length > 0">
              <el-icon class="order-table-body__route-arrow"><ArrowRight /></el-icon>
              <span class="order-table-body__route-waypoint">{{ formatRoute(row).waypoints.join('、') }}</span>
            </template>
            <template v-if="formatRoute(row).origin && formatRoute(row).dest">
              <el-icon class="order-table-body__route-arrow"><ArrowRight /></el-icon>
            </template>
            <span
              v-if="formatRoute(row).dest"
              class="order-table-body__route-dest"
            >{{ formatRoute(row).dest }}</span>
          </span>
        </template>
        <span v-else>-</span>
      </template>
    </el-table-column>
    <el-table-column
      label="集装箱"
      width="160"
      align="center"
    >
      <template #default="{ row }">
        <template v-if="row.containerNo">
          {{ row.containerNo }}<template v-if="row.containerType"> / {{ row.containerType }}</template>
        </template>
        <span v-else>-</span>
      </template>
    </el-table-column>
    <el-table-column
      label="单证"
      min-width="70"
      align="center"
    >
      <template #default="{ row }">
        <template v-if="row.documents && row.documents.length > 0">
          <el-tag
            v-for="doc in row.documents"
            :key="doc"
            size="small"
            style="margin-right: 4px"
          >
            {{ documentLabels[doc] || doc }}
          </el-tag>
        </template>
        <span v-else>-</span>
      </template>
    </el-table-column>
    <el-table-column
      label="司机/车牌"
      width="140"
      align="center"
    >
      <template #default="{ row }">
        {{ row.driverName || '-' }} / {{ row.vehiclePlateNo || '-' }}
      </template>
    </el-table-column>
    <el-table-column
      label="状态"
      width="100"
      align="center"
    >
      <template #default="{ row }">
        <el-tag
          :type="statusTagConfig[row.status]?.type || 'info'"
          size="small"
        >
          <span
            class="order-table-body__status-dot"
            :style="{ backgroundColor: statusTagConfig[row.status]?.dotColor || '#909399' }"
          />
          {{ statusTagConfig[row.status]?.label || row.status }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column
      label="创建时间"
      width="170"
      align="center"
    >
      <template #default="{ row }">
        {{ formatDateTime(row.createdAt) }}
      </template>
    </el-table-column>
    <el-table-column
      label="操作"
      width="140"
      align="center"
      fixed="right"
    >
      <template #default="{ row }">
        <el-button
          v-if="canAssign(row)"
          type="primary"
          size="small"
          link
          @click="emit('assign', row)"
        >
          分配
        </el-button>
        <el-button
          v-if="canEdit(row)"
          size="small"
          link
          @click="emit('edit', row)"
        >
          编辑
        </el-button>
        <el-dropdown
          trigger="click"
          @command="(cmd: string) => {
            if (cmd === 'complete') emit('complete', row)
            if (cmd === 'delete') handleDelete(row)
          }"
        >
          <el-button
            size="small"
            link
          >
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-if="canComplete(row)"
                command="complete"
              >
                标记完成
              </el-dropdown-item>
              <el-dropdown-item
                command="delete"
                class="order-table-body__dropdown-danger"
              >
                删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped>
/* 路线颜色 */
.order-table-body__route {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}

.order-table-body__route-origin {
  color: #409eff;
  font-weight: 500;
}

.order-table-body__route-dest {
  color: #f56c6c;
  font-weight: 500;
}

.order-table-body__route-waypoint {
  color: #909399;
}

.order-table-body__route-arrow {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0 2px;
}

/* 状态圆点 */
.order-table-body__status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
}

/* 下拉菜单删除项红色 */
:deep(.order-table-body__dropdown-danger) {
  color: #f56c6c;
}

/* 行高控制 - 防止内容换行撑高行 */
:deep(.el-table__cell .cell) {
  white-space: nowrap;
  line-height: 23px;
}
</style>

<style>
/* 竖线分隔 - 非 scoped 以穿透 el-table 内部 DOM */
/* 需要覆盖 .el-table:not(.el-table--border) .el-table__cell { border-right: none } */

/* 表头竖线 */
.el-table:not(.el-table--border) .el-table__header-wrapper th.el-table__cell {
  border-right: 1px solid #ebeef5;
}

/* 表体竖线 */
.el-table:not(.el-table--border) .el-table__body-wrapper td.el-table__cell {
  border-right: 1px solid #ebeef5;
}

/* 最后一列无竖线 */
.el-table:not(.el-table--border) .el-table__header-wrapper th.el-table__cell:last-child,
.el-table:not(.el-table--border) .el-table__body-wrapper td.el-table__cell:last-child {
  border-right: none;
}

/* 固定列无竖线 */
.el-table:not(.el-table--border) .el-table__header-wrapper th.el-table__cell.el-table-fixed-column--right,
.el-table:not(.el-table--border) .el-table__body-wrapper td.el-table__cell.el-table-fixed-column--right {
  border-right: none;
}
</style>
