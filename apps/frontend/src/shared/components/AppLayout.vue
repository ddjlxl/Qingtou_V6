<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/modules/auth'
import {
  Menu as IconMenu,
  Van,
  SwitchButton,
  ArrowDown,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isCollapsed = ref(false)

const activeMenu = computed(() => route.path)

const displayName = computed(() => authStore.user?.name || authStore.user?.username || '')

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="app-layout">
    <el-aside
      :width="isCollapsed ? '64px' : '220px'"
      class="app-aside"
    >
      <div class="app-logo">
        <span
          v-if="!isCollapsed"
          class="app-logo__text"
        >青投供应链</span>
        <span
          v-else
          class="app-logo__text app-logo__text--mini"
        >青</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        router
        class="app-menu"
      >
        <el-menu-item index="/fleet">
          <el-icon>
            <Van />
          </el-icon>
          <template #title>
            车队管理
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="app-header">
        <div class="app-header__left">
          <el-icon
            class="app-header__collapse-btn"
            @click="isCollapsed = !isCollapsed"
          >
            <IconMenu />
          </el-icon>
        </div>
        <div class="app-header__right">
          <el-dropdown trigger="click">
            <span class="app-header__user">
              {{ displayName }}
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">
                  <el-icon>
                    <SwitchButton />
                  </el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-layout {
  height: 100%;
}

.app-aside {
  background: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.app-logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #263445;
}

.app-logo__text {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.app-logo__text--mini {
  font-size: 22px;
}

.app-menu {
  border-right: none;
  background: #304156;
}

.app-menu:not(.el-menu--collapse) {
  width: 220px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  height: 60px;
}

.app-header__left {
  display: flex;
  align-items: center;
}

.app-header__collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.app-header__collapse-btn:hover {
  color: #409eff;
}

.app-header__right {
  display: flex;
  align-items: center;
}

.app-header__user {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
}

.app-header__user:hover {
  color: #409eff;
}

.app-main {
  background: #f0f2f5;
  overflow-y: auto;
}
</style>
