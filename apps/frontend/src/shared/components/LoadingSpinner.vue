<template>
  <div
    class="loading-spinner"
    :class="{ 'loading-spinner--fullscreen': fullscreen }"
  >
    <el-icon
      class="loading-spinner__icon"
      :size="32"
    >
      <Loading />
    </el-icon>
    <p
      v-if="text"
      class="loading-spinner__text"
    >
      {{ text }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'

interface Props {
  fullscreen?: boolean
  text?: string
}

withDefaults(defineProps<Props>(), {
  fullscreen: false,
  text: '加载中...',
})
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #409eff;
}

.loading-spinner--fullscreen {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(255, 255, 255, 0.9);
}

.loading-spinner__icon {
  animation: spin 1s linear infinite;
}

.loading-spinner__text {
  margin: 12px 0 0;
  font-size: 14px;
  color: #909399;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
