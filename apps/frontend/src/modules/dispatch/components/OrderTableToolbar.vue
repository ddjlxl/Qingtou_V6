<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'

defineEmits<{
  create: []
}>()

const keyword = defineModel<string>('keyword', { required: true })
</script>

<template>
  <div class="order-table-toolbar">
    <el-input
      v-model="keyword"
      placeholder="搜索任务编号/箱号/客户名称"
      clearable
      style="width: 320px"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <el-button
      type="primary"
      @click="$emit('create')"
    >
      新建任务
    </el-button>
  </div>
</template>

<style scoped>
.order-table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>