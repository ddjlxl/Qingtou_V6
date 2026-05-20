<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { List, Clock, User } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

function isActiveTab(path: string): boolean {
  if (path === '/driver') return route.path === '/driver'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="mobile-tabbar">
    <div
      class="mobile-tabbar__item"
      :class="{ 'mobile-tabbar__item--active': isActiveTab('/driver') }"
      @click="router.push('/driver')"
    >
      <el-icon :size="20">
        <List />
      </el-icon>
      <span>任务</span>
    </div>
    <div
      class="mobile-tabbar__item"
      :class="{ 'mobile-tabbar__item--active': isActiveTab('/driver/history') }"
      @click="router.push('/driver/history')"
    >
      <el-icon :size="20">
        <Clock />
      </el-icon>
      <span>历史</span>
    </div>
    <div
      class="mobile-tabbar__item"
      :class="{ 'mobile-tabbar__item--active': isActiveTab('/driver/profile') }"
      @click="router.push('/driver/profile')"
    >
      <el-icon :size="20">
        <User />
      </el-icon>
      <span>我的</span>
    </div>
  </div>
</template>

<style scoped>
.mobile-tabbar {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  background: #fff;
  border-top: 1px solid #eee;
  padding-bottom: env(safe-area-inset-bottom);
}

.mobile-tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #999;
  cursor: pointer;
  gap: 2px;
}

.mobile-tabbar__item--active {
  color: #409eff;
}
</style>
