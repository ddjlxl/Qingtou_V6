import WarehousePage from './pages/WarehousePage.vue'

export { WarehousePage }

export const warehouseRoutes = [
  {
    path: '/warehouse',
    name: 'Warehouse',
    component: WarehousePage,
    meta: { title: '仓库总览', icon: 'Warehouse' },
  },
]
