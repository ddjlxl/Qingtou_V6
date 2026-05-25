import { ref, watch } from 'vue'
import { warehouseService } from '../services/warehouseService'
import type { SearchHighlight, SearchResponse } from '../types'

export function useWarehouseSearch(debounceMs = 300) {
  const keyword = ref('')
  const searchHighlights = ref<Map<string, SearchHighlight>>(new Map())
  const zoneCounts = ref<Record<string, number>>({})
  const searchTotal = ref(0)
  const searching = ref(false)

  let timer: ReturnType<typeof setTimeout> | null = null

  async function doSearch(kw: string) {
    if (!kw.trim()) {
      searchHighlights.value = new Map()
      zoneCounts.value = {}
      searchTotal.value = 0
      return
    }
    searching.value = true
    try {
      const result: SearchResponse = await warehouseService.searchSlots(kw.trim())
      const map = new Map<string, SearchHighlight>()
      for (const item of result.items) {
        map.set(item.slotId, item)
      }
      searchHighlights.value = map
      zoneCounts.value = result.zoneCounts
      searchTotal.value = result.total
    } catch {
      searchHighlights.value = new Map()
      zoneCounts.value = {}
      searchTotal.value = 0
    } finally {
      searching.value = false
    }
  }

  watch(keyword, (val) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => doSearch(val), debounceMs)
  })

  function clearSearch() {
    keyword.value = ''
  }

  return {
    keyword,
    searchHighlights,
    zoneCounts,
    searchTotal,
    searching,
    clearSearch,
  }
}
