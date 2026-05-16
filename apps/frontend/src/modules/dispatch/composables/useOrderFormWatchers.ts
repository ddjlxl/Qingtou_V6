import { watch } from 'vue'
import type { Ref } from 'vue'
import type { OrderFormState } from './useOrderForm'
import type { Order } from '../types/order'
import { dispatchService } from '../services/dispatchService'
import type { AvailableDriver, AvailableVehicle } from '../types/order'
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
      if (!val || options.mode.value !== 'create') return
      try {
        const result = await dispatchService.getRouteTemplate(val)
        if (result.originName && !form.originName) {
          form.originName = result.originName
        }
        const hasWaypoints = form.waypoints.filter((w) => w.trim()).length > 0
        if (!hasWaypoints) {
          form.waypoints = result.waypoints ? [...result.waypoints] : []
        }
        if (result.destName && !form.destName) {
          form.destName = result.destName
        }
      } catch {
        // 无模板数据，忽略
      }
    }
  )
}

function watchVehicleId(
  form: OrderFormState,
  options: { mode: Ref<'create' | 'edit'> },
  availableVehicles: AvailableVehicle[],
  availableDrivers: AvailableDriver[],
) {
  watch(
    () => form.vehicleId,
    (val) => {
      if (val && options.mode.value === 'create') {
        const vehicle = availableVehicles.find((v) => v.id === val)
        if (vehicle?.boundDriverName) {
          const driver = availableDrivers.find(
            (d) => d.name === vehicle.boundDriverName
          )
          if (driver) {
            form.driverId = driver.id
          }
        }
      }
    }
  )
}

function watchDriverId(
  form: OrderFormState,
  options: { mode: Ref<'create' | 'edit'> },
  availableDrivers: AvailableDriver[],
  availableVehicles: AvailableVehicle[],
) {
  watch(
    () => form.driverId,
    (val) => {
      if (val && options.mode.value === 'create') {
        const driver = availableDrivers.find((d) => d.id === val)
        if (driver?.boundVehiclePlateNo) {
          const vehicle = availableVehicles.find(
            (v) => v.plateNo === driver.boundVehiclePlateNo
          )
          if (vehicle) {
            form.vehicleId = vehicle.id
          }
        }
      }
    }
  )
}

export function useOrderFormWatchers(
  form: OrderFormState,
  options: {
    mode: Ref<'create' | 'edit'>
    order: Ref<Order | null | undefined>
    visible: Ref<boolean>
  },
  availableDrivers: AvailableDriver[],
  availableVehicles: AvailableVehicle[],
  fetchAvailableResources: () => Promise<void>,
) {
  watchVisible(form, options, fetchAvailableResources)
  watchBusinessType(form, options)
  watchVehicleId(form, options, availableVehicles, availableDrivers)
  watchDriverId(form, options, availableDrivers, availableVehicles)
}