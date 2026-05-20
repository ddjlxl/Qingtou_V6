<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/modules/auth'
import { User } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
const displayName = computed(() => authStore.user?.name || authStore.user?.username || '司机')

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确认退出登录？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    authStore.logout()
    router.push('/login')
  } catch {
    // 用户取消
  }
}
</script>

<template>
  <div class="driver-profile">
    <div class="driver-profile__avatar">
      <el-icon :size="48">
        <User />
      </el-icon>
    </div>
    <div class="driver-profile__name">
      {{ displayName }}
    </div>
    <el-button
      type="danger"
      @click="handleLogout"
    >
      退出登录
    </el-button>
  </div>
</template>

<style scoped>
.driver-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 16px;
}

.driver-profile__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.driver-profile__name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
</style>
