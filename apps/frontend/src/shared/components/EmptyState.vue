<template>
  <div class="empty-state">
    <el-icon
      class="empty-state__icon"
      :size="64"
    >
      <component :is="iconComponent" />
    </el-icon>
    <p class="empty-state__title">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="empty-state__description"
    >
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import {
  PictureFilled,
  Document,
  Search,
  FolderOpened,
  CircleCloseFilled,
} from '@element-plus/icons-vue'

interface Props {
  icon?: string
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'PictureFilled',
  title: '暂无数据',
  description: '',
})

const iconMap: Record<string, Component> = {
  PictureFilled,
  Document,
  Search,
  FolderOpened,
  CircleCloseFilled,
}

const iconComponent = computed(() => iconMap[props.icon] ?? PictureFilled)
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: #909399;
}

.empty-state__icon {
  margin-bottom: 16px;
}

.empty-state__title {
  font-size: 14px;
  margin: 0 0 8px;
}

.empty-state__description {
  font-size: 12px;
  color: #c0c4cc;
  margin: 0;
}
</style>
