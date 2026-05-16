import { ref } from 'vue'
import { fleetService } from '../services/fleetService'
import type {
  TransportRecord, TransportRecordListParams, TransportRecordStatistics, ImportResult,
} from '../types/transport-record'

type RecordsRef = ReturnType<typeof ref<TransportRecord[]>>
type LoadingRef = ReturnType<typeof ref<boolean>>
type ErrorRef = ReturnType<typeof ref<string | null>>
type TotalRef = ReturnType<typeof ref<number>>
type StatsRef = ReturnType<typeof ref<TransportRecordStatistics | null>>

export async function fetchTransportRecordsAction(
  records: RecordsRef, loading: LoadingRef, error: ErrorRef,
  total: TotalRef, params?: TransportRecordListParams,
) {
  loading.value = true
  error.value = null
  try {
    const result = await fleetService.getTransportRecords(params)
    records.value = result.items
    total.value = result.total
    return result
  } catch (e) {
    error.value = e instanceof Error ? e.message : '获取运输流水失败'
    throw e
  } finally {
    loading.value = false
  }
}

export async function importTransportRecordsAction(
  loading: LoadingRef, error: ErrorRef, file: File,
): Promise<ImportResult> {
  loading.value = true
  error.value = null
  try {
    const result = await fleetService.importTransportRecords(file)
    return result
  } catch (e) {
    error.value = e instanceof Error ? e.message : '导入运输流水失败'
    throw e
  } finally {
    loading.value = false
  }
}

export async function fetchTransportRecordStatisticsAction(
  loading: LoadingRef, error: ErrorRef, statistics: StatsRef,
) {
  loading.value = true
  error.value = null
  try {
    const result = await fleetService.getTransportRecordStatistics()
    statistics.value = result
    return result
  } catch (e) {
    error.value = e instanceof Error ? e.message : '获取运输统计失败'
    throw e
  } finally {
    loading.value = false
  }
}

export async function downloadTransportRecordTemplateAction(error: ErrorRef) {
  try {
    const blob = await fleetService.downloadTemplate()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transport_record_template.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '下载模板失败'
    throw e
  }
}

export function useFleetTransport() {
  const transportRecords = ref<TransportRecord[]>([])
  const transportRecordLoading = ref(false)
  const transportRecordError = ref<string | null>(null)
  const transportRecordTotal = ref(0)
  const transportRecordStatistics = ref<TransportRecordStatistics | null>(null)

  function fetchTransportRecords(params?: TransportRecordListParams) {
    return fetchTransportRecordsAction(
      transportRecords, transportRecordLoading, transportRecordError, transportRecordTotal, params,
    )
  }
  function importTransportRecords(file: File) {
    return importTransportRecordsAction(transportRecordLoading, transportRecordError, file)
  }
  function fetchTransportRecordStatistics() {
    return fetchTransportRecordStatisticsAction(
      transportRecordLoading, transportRecordError, transportRecordStatistics,
    )
  }
  function downloadTransportRecordTemplate() {
    return downloadTransportRecordTemplateAction(transportRecordError)
  }

  function resetTransport() {
    transportRecords.value = []
    transportRecordLoading.value = false
    transportRecordError.value = null
    transportRecordTotal.value = 0
    transportRecordStatistics.value = null
  }

  return {
    transportRecords, transportRecordLoading, transportRecordError,
    transportRecordTotal, transportRecordStatistics,
    fetchTransportRecords, importTransportRecords,
    fetchTransportRecordStatistics, downloadTransportRecordTemplate,
    resetTransport,
  }
}