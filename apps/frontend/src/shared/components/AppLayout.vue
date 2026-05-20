<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/modules/auth'
import MobileTabBar from './MobileTabBar.vue'
import {
  Menu as IconMenu,
  Van,
  Location,
  SwitchButton,
  ArrowDown,
  List,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isCollapsed = ref(false)

const activeMenu = computed(() => route.path)

const displayName = computed(() => authStore.user?.name || authStore.user?.username || '')

const isDriver = computed(() => authStore.userRole === 'driver')

const isMobile = ref(false)
let mediaQuery: MediaQueryList

function checkMobile() {
  isMobile.value = mediaQuery.matches && authStore.userRole === 'driver'
}

onMounted(() => {
  mediaQuery = window.matchMedia('(max-width: 767px)')
  mediaQuery.addEventListener('change', checkMobile)
  checkMobile()
})

onUnmounted(() => {
  mediaQuery.removeEventListener('change', checkMobile)
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <!-- 桌面端：现有侧边栏布局 -->
  <el-container
    v-if="!isMobile"
    class="app-layout"
  >
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
        <el-menu-item
          v-if="isDriver"
          index="/driver"
        >
          <el-icon>
            <List />
          </el-icon>
          <template #title>
            我的任务
          </template>
        </el-menu-item>
        <template v-if="!isDriver">
          <el-menu-item index="/fleet">
            <el-icon>
              <Van />
            </el-icon>
            <template #title>
              车队管理
            </template>
          </el-menu-item>
          <el-menu-item index="/dispatch">
            <el-icon>
              <Location />
            </el-icon>
            <template #title>
              调度中心
            </template>
          </el-menu-item>
        </template>
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

  <!-- 移动端：顶部标题栏 + 内容 + 底部 Tab 栏 -->
  <div
    v-else
    class="app-layout-mobile"
  >
    <div class="mobile-topbar">
      我的任务
    </div>
    <div class="mobile-content">
      <router-view />
    </div>
    <MobileTabBar />
  </div>
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

.app-layout-mobile {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.mobile-topbar {
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.mobile-content {
  flex: 1;
  overflow: hidden;
}
</style>
