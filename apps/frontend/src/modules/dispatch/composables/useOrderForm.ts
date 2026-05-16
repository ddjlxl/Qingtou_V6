import { computed } from 'vue'
import type { Ref } from 'vue'
import { useDispatchStore } from '../stores/useDispatchStore'
import {
  BusinessType,
  DocumentType,
  ContainerType,
} from '../types/order'
import type { Order } from '../types/order'
import { containerTypeOptions, businessTypeOptions, documentOptions } from './useOrderFormOptions'
import { useOrderFormRules } from './useOrderFormRules'
import { useOrderFormWatchers } from './useOrderFormWatchers'
import {
  createInitialFormState,
  computeRouteSummary,
  addWaypoint,
  removeWaypoint,
  onContainerNoInput,
  onSealNoInput,
  buildRequest,
} from './useOrderFormHelpers'

export interface OrderFormState {
  customerName: string
  customerPhone: string
  originName: string
  destName: string
  waypoints: string[]
  containerNo: string
  containerType: ContainerType | ''
  sealNo: string
  businessType: BusinessType | ''
  documents: DocumentType[]
  driverId: string
  vehicleId: string
  remark: string
}

export function useOrderForm(options: {
  mode: Ref<'create' | 'edit'>
  order: Ref<Order | null | undefined>
  visible: Ref<boolean>
}) {
  const store = useDispatchStore()
  const form = createInitialFormState()

  const canCreateAndAssign = computed(() => form.driverId !== '' && form.vehicleId !== '')
  const isEditMode = computed(() => options.mode.value === 'edit')
  const dialogTitle = computed(() => isEditMode.value ? '编辑任务' : '新建任务')
  const routeSummary = computed(() => computeRouteSummary(form))
  const formRules = useOrderFormRules(form)

  useOrderFormWatchers(
    form,
    options,
    store.availableDrivers,
    store.availableVehicles,
    () => store.fetchAvailableResources(),
  )

  return {
    form,
    formRules,
    containerTypeOptions,
    businessTypeOptions,
    documentOptions,
    canCreateAndAssign,
    isEditMode,
    dialogTitle,
    routeSummary,
    addWaypoint: () => addWaypoint(form),
    removeWaypoint: (index: number) => removeWaypoint(form, index),
    onContainerNoInput: (val: string) => onContainerNoInput(form, val),
    onSealNoInput: (val: string) => onSealNoInput(form, val),
    buildRequest: () => buildRequest(form),
  }
}