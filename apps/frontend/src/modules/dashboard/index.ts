export { default as DashboardPage } from './pages/DashboardPage.vue'
export { default as MapArea } from './components/MapArea.vue'
export { default as FleetPanel } from './components/FleetPanel.vue'
export { default as StatusOverview } from './components/StatusOverview.vue'
export { useDashboardStore } from './stores/useDashboardStore'
export { dashboardService } from './services/dashboardService'
export type {
  DashboardStats,
  VehicleDashboardStatus,
  VehicleLocation,
  StatusCounts,
  DashboardData,
} from './types'
