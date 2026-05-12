<script setup lang="ts">
import { ref } from 'vue'
import StatisticsTab from '../components/StatisticsTab.vue'
import VehicleManagement from '../components/VehicleManagement.vue'
import DriverManagement from '../components/DriverManagement.vue'
import CertificateManagement from '../components/CertificateManagement.vue'
import TransportRecordManagement from '../components/TransportRecordManagement.vue'

const activeTab = ref('statistics')

function handleTabChange(tab: string) {
  activeTab.value = tab
}
</script>

<template>
  <div class="fleet-page">
    <el-tabs
      v-model="activeTab"
      class="fleet-tabs"
    >
      <el-tab-pane
        label="统计概览"
        name="statistics"
      >
        <StatisticsTab @tab-change="handleTabChange" />
      </el-tab-pane>
      <el-tab-pane
        label="车辆管理"
        name="vehicle"
      >
        <VehicleManagement />
      </el-tab-pane>
      <el-tab-pane
        label="司机管理"
        name="driver"
      >
        <DriverManagement />
      </el-tab-pane>
      <el-tab-pane
        label="证照管理"
        name="certificate"
      >
        <CertificateManagement />
      </el-tab-pane>
      <el-tab-pane
        label="运输流水"
        name="transport"
      >
        <TransportRecordManagement />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.fleet-page {
  padding: 16px;
}

.fleet-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 0 16px;
}
</style>