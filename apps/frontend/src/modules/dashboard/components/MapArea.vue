<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { VehicleLocation, VehicleDashboardStatus } from '../types'

const props = defineProps<{
  vehicles: VehicleLocation[]
  selectedVehicleId: string | null
}>()

const emit = defineEmits<{
  'select-vehicle': [id: string]
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
const mapError = ref<string | null>(null)
let map: L.Map | null = null
const markerMap = new Map<string, L.Marker>()
let hasFittedBounds = false

const STATUS_COLORS: Record<VehicleDashboardStatus, string> = {
  idle: '#67c23a',
  transiting: '#409eff',
  overdue: '#f56c6c',
}

const STATUS_LABELS: Record<VehicleDashboardStatus, string> = {
  idle: '空闲',
  transiting: '运输中',
  overdue: '超时',
}

function getStatusIcon(status: VehicleDashboardStatus): L.DivIcon {
  const color = STATUS_COLORS[status]
  return L.divIcon({
    className: 'vehicle-marker',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  })
}

function formatPopupContent(vehicle: VehicleLocation): string {
  const statusLabel = STATUS_LABELS[vehicle.status]
  const statusColor = STATUS_COLORS[vehicle.status]
  const driverInfo = vehicle.driverName ?? '未分配'
  return `
    <div style="font-size:13px;line-height:1.6;">
      <div style="font-weight:600;font-size:14px;">${vehicle.plateNo}</div>
      <div>司机：${driverInfo}</div>
      <div>状态：<span style="color:${statusColor};font-weight:500;">${statusLabel}</span></div>
    </div>
  `
}

function createTileLayer(): L.TileLayer | null {
  const tiandituKey = import.meta.env.VITE_TIANDITU_KEY as string | undefined
  if (!tiandituKey) {
    return null
  }
  return L.tileLayer(
    `https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}&tk=${tiandituKey}`,
    { subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'] },
  )
}

function updateMarkers(vehicles: VehicleLocation[]) {
  if (!map) return

  const vehiclesWithCoords = vehicles.filter((v) => v.lat !== null && v.lng !== null)
  const newIds = new Set(vehiclesWithCoords.map((v) => v.id))

  for (const [id, marker] of markerMap) {
    if (!newIds.has(id)) {
      map.removeLayer(marker)
      markerMap.delete(id)
    }
  }

  for (const v of vehiclesWithCoords) {
    const lat = v.lat as number
    const lng = v.lng as number
    const existing = markerMap.get(v.id)

    if (existing) {
      existing.setLatLng([lat, lng])
      existing.setIcon(getStatusIcon(v.status))
    } else {
      const marker = L.marker([lat, lng], { icon: getStatusIcon(v.status) })
      marker.bindPopup(formatPopupContent(v))
      marker.on('click', () => emit('select-vehicle', v.id))
      marker.addTo(map)
      markerMap.set(v.id, marker)
    }
  }

  if (!hasFittedBounds && vehiclesWithCoords.length > 0) {
    const group = L.featureGroup(Array.from(markerMap.values()))
    map.fitBounds(group.getBounds().pad(0.1))
    hasFittedBounds = true
  }
}

function handleSelectedVehicleChange(id: string | null) {
  if (!id || !map) return

  const vehicle = props.vehicles.find((v) => v.id === id)
  if (!vehicle || vehicle.lat === null || vehicle.lng === null) return

  map.flyTo([vehicle.lat, vehicle.lng], 15)
  const marker = markerMap.get(id)
  if (marker) {
    marker.openPopup()
  }
}

watch(() => props.vehicles, updateMarkers, { deep: true })
watch(() => props.selectedVehicleId, handleSelectedVehicleChange)

onMounted(() => {
  if (!mapContainer.value) return

  const tileLayer = createTileLayer()
  if (!tileLayer) {
    mapError.value = '天地图服务不可用，请联系管理员配置 VITE_TIANDITU_KEY'
    return
  }

  map = L.map(mapContainer.value, {
    center: [31.23, 121.47],
    zoom: 12,
    zoomControl: true,
  })

  tileLayer.addTo(map)

  if (props.vehicles.length > 0) {
    updateMarkers(props.vehicles)
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
  markerMap.clear()
  hasFittedBounds = false
})
</script>

<template>
  <div
    v-if="mapError"
    class="map-error"
  >
    <el-empty :description="mapError">
      <template #image>
        <el-icon :size="60" color="#909399">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
            <path fill="currentColor" d="M464 336a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm72 112h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V456c0-4.4-3.6-8-8-8z"/>
          </svg>
        </el-icon>
      </template>
    </el-empty>
  </div>
  <div
    v-else
    ref="mapContainer"
    class="map-area"
  />
</template>

<style scoped>
.map-area {
  width: 100%;
  height: 100%;
}

.map-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}
</style>
