import { watch } from 'vue'
import type { Ref } from 'vue'
import type { OrderFormState } from './useOrderForm'
import type { Order } from '../types/order'
import { dispatchService } from '../services/dispatchService'
import type { AvailableDriver, AvailableVehicle, DocumentType, ContainerStatus } from '../types/order'
import { fillFormFromOrder, resetForm } from './useOrderFormHelpers'

function watchVisible(
  form: OrderFormState,
  options: {
    mode: Ref<'create' | 'edit'>
    order: Ref<Order | null | undefined>
    visible: Ref<boolean>
  },
  fetchAvailableResources: () => Promise<void>,
) {
  watch(
    () => options.visible.value,
    (val) => {
      if (val) {
        if (options.mode.value === 'edit' && options.order.value) {
          fillFormFromOrder(form, options.order.value)
        } else {
          resetForm(form)
        }
        fetchAvailableResources()
      }
    }
  )
}

function watchBusinessType(
  form: OrderFormState,
  options: { mode: Ref<'create' | 'edit'> },
) {
  watch(
    () => form.businessType,
    async (val) => {
      if (!val) {
        form.originName = ''
        form.waypoints = []
        form.destName = ''
        form.documents = []
        form.containerStatus = ''
        return
      }
      try {
        const result = await dispatchService.getRouteTemplate(val)
        if (result.originName) {
          form.originName = result.originName
        }
        form.waypoints = result.waypoints ? [...result.waypoints] : []
        if (result.destName) {
          form.destName = result.destName
        }
        if (result.documents && result.documents.length > 0) {
          form.documents = [...result.documents] as DocumentType[]
        }
        if (result.containerStatus) {
          form.containerStatus = result.containerStatus as ContainerStatus
        }
      } catch {
        // 无模板数据，忽略
      }
    }
  )
}

let autoFillDepth = 0

function watchVehicleId(
  form: OrderFormState,
  options: { mode: Ref<'create' | 'edit'> },
  getAvailableVehicles: () => AvailableVehicle[],
  getAvailableDrivers: () => AvailableDriver[],
) {
  watch(
    () => form.vehicleId,
    (val) => {
      if (autoFillDepth > 0 || options.mode.value !== 'create') return
      if (!val) {
        form.driverId = ''
        return
      }
      const vehicle = getAvailableVehicles().find((v) => v.id === val)
      if (vehicle?.boundDriverName) {
        const driver = getAvailableDrivers().find(
          (d) => d.name === vehicle.boundDriverName
        )
        if (driver) {
          autoFillDepth++
          form.driverId = driver.id
          autoFillDepth--
        }
      }
    },
    { flush: 'sync' },
  )
}

function watchDriverId(
  form: OrderFormState,
  options: { mode: Ref<'create' | 'edit'> },
  getAvailableDrivers: () => AvailableDriver[],
  getAvailableVehicles: () => AvailableVehicle[],
) {
  watch(
    () => form.driverId,
    (val) => {
      if (autoFillDepth > 0 || options.mode.value !== 'create') return
      if (!val) {
        form.vehicleId = ''
        return
      }
      const driver = getAvailableDrivers().find((d) => d.id === val)
      if (driver?.boundVehiclePlateNo) {
        const vehicle = getAvailableVehicles().find(
          (v) => v.plateNo === driver.boundVehiclePlateNo
        )
        if (vehicle) {
          autoFillDepth++
          form.vehicleId = vehicle.id
          autoFillDepth--
        }
      }
    },
    { flush: 'sync' },
  )
}

export function useOrderFormWatchers(
  form: OrderFormState,
  options: {
    mode: Ref<'create' | 'edit'>
    order: Ref<Order | null | undefined>
    visible: Ref<boolean>
  },
  getAvailableDrivers: () => AvailableDriver[],
  getAvailableVehicles: () => AvailableVehicle[],
  fetchAvailableResources: () => Promise<void>,
) {
  watchVisible(form, options, fetchAvailableResources)
  watchBusinessType(form, options)
  watchVehicleId(form, options, getAvailableVehicles, getAvailableDrivers)
  watchDriverId(form, options, getAvailableDrivers, getAvailableVehicles)
}