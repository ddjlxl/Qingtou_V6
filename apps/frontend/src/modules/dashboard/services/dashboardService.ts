import http from '@/shared/api/client'
import type { DashboardData } from '../types'

export const dashboardService = {
  getDashboard() {
    return http.get<DashboardData>('/v1/dashboard')
  },
}
