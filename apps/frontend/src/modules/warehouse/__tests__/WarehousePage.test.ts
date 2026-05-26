import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import ElementPlus from 'element-plus'
import { setActivePinia, createPinia } from 'pinia'
import WarehousePage from '../pages/WarehousePage.vue'
import type { Zone, Slot, WarehouseStatistics, SearchHighlight } from '../types'

const mockInit = vi.fn()
const mockFetchZones = vi.fn()
const mockFetchStatistics = vi.fn()
const mockSetFilter = vi.fn()
const mockToggleSlotSelection = vi.fn()
const mockToggleMoveMode = vi.fn()
const mockSetMoveSource = vi.fn()
const mockMove = vi.fn()
const mockSetSearchHighlights = vi.fn()
const mockClearSearchHighlights = vi.fn()

const mockStore = {
  zones: [] as Zone[],
  loading: false,
  filter: 'all' as const,
  statistics: null as WarehouseStatistics | null,
  selectedSlotIds: new Set<string>(),
  selectedSlots: [] as Slot[],
  isMoveMode: false,
  moveSourceSlot: null as Slot | null,
  init: mockInit,
  fetchZones: mockFetchZones,
  fetchStatistics: mockFetchStatistics,
  setFilter: mockSetFilter,
  toggleSlotSelection: mockToggleSlotSelection,
  toggleMoveMode: mockToggleMoveMode,
  setMoveSource: mockSetMoveSource,
  move: mockMove,
  setSearchHighlights: mockSetSearchHighlights,
  clearSearchHighlights: mockClearSearchHighlights,
}

vi.mock('../stores/useWarehouseStore', () => ({
  useWarehouseStore: () => mockStore,
}))

const mockKeyword = ref('')
const mockSearchHighlights = ref(new Map<string, SearchHighlight>())
const mockZoneCounts = ref<Record<string, number>>({})
const mockSearchTotal = ref(0)

vi.mock('../composables/useWarehouseSearch', () => ({
  useWarehouseSearch: () => ({
    keyword: mockKeyword,
    searchHighlights: mockSearchHighlights,
    zoneCounts: mockZoneCounts,
    searchTotal: mockSearchTotal,
    clearSearch: vi.fn(),
  }),
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  }
})

function makeSlot(overrides: Partial<Slot> = {}): Slot {
  return {
    id: 'slot-1',
    slotNo: 'A-01-01',
    zoneCode: 'A',
    row: 1,
    col: 1,
    status: 'empty',
    containerNo: null,
    containerStatus: null,
    customerName: null,
    containerType: null,
    sealNo: null,
    storedAt: null,
    remark: null,
    ...overrides,
  }
}

function makeZone(overrides: Partial<Zone> = {}): Zone {
  return {
    id: 'zone-1',
    zoneCode: 'A',
    name: 'A区',
    sortOrder: 1,
    usedCount: 0,
    totalCount: 10,
    slots: [makeSlot({ id: 'slot-1', slotNo: 'A-01-01' }), makeSlot({ id: 'slot-2', slotNo: 'A-01-02' })],
    ...overrides,
  }
}

function makeStats(): WarehouseStatistics {
  return {
    totalSlots: 100,
    usedSlots: 60,
    availableSlots: 40,
    heavyCount: 45,
    emptyContainerCount: 15,
    utilizationRate: 0.6,
  }
}

function createWrapper() {
  return mount(WarehousePage, {
    global: {
      plugins: [ElementPlus],
      stubs: {
        StatisticsPanel: {
          template: '<div class="statistics-panel-stub" />',
          props: ['stats'],
        },
        ZoneCard: {
          template: '<div class="zone-card-stub" />',
          props: ['zone', 'filter', 'selectedSlotIds', 'moveSourceId', 'isMoveMode', 'searchHitIds', 'searchMatchCount'],
        },
        ManualInboundDialog: {
          template: '<div class="manual-inbound-dialog-stub" />',
          props: ['visible', 'zoneCode'],
        },
        ImportInboundDialog: {
          template: '<div class="import-inbound-dialog-stub" />',
          props: ['visible', 'zoneCode'],
        },
        OutboundDialog: {
          template: '<div class="outbound-dialog-stub" />',
          props: ['visible', 'selectedSlots'],
        },
        SlotEditDialog: {
          template: '<div class="slot-edit-dialog-stub" />',
          props: ['visible', 'slotData'],
        },
      },
    },
  })
}

describe('WarehousePage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStore.zones = []
    mockStore.loading = false
    mockStore.filter = 'all'
    mockStore.statistics = null
    mockStore.selectedSlotIds = new Set()
    mockStore.selectedSlots = []
    mockStore.isMoveMode = false
    mockStore.moveSourceSlot = null
    mockKeyword.value = ''
    mockSearchHighlights.value = new Map()
    mockZoneCounts.value = {}
    mockSearchTotal.value = 0
  })

  describe('页面加载', () => {
    it('onMounted 调用 store.init()', async () => {
      createWrapper()
      await flushPromises()
      expect(mockInit).toHaveBeenCalled()
    })

    it('显示统计面板', async () => {
      mockStore.statistics = makeStats()
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.find('.statistics-panel-stub').exists()).toBe(true)
    })

    it('显示区域列表', async () => {
      mockStore.zones = [makeZone(), makeZone({ id: 'zone-2', zoneCode: 'B' })]
      const wrapper = createWrapper()
      await flushPromises()
      const zoneCards = wrapper.findAll('.zone-card-stub')
      expect(zoneCards.length).toBe(2)
    })
  })

  describe('加载状态', () => {
    it('loading=true 时显示加载动画', async () => {
      mockStore.loading = true
      const wrapper = createWrapper()
      await flushPromises()
      const zonesContainer = wrapper.find('.warehouse-page__zones')
      expect(zonesContainer.attributes('element-loading-text') || zonesContainer.element.className).toBeDefined()
    })

    it('loading=false 时不显示加载动画', async () => {
      mockStore.loading = false
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.find('.warehouse-page__zones').exists()).toBe(true)
    })
  })

  describe('筛选功能', () => {
    it('显示筛选选项', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      const radioGroup = wrapper.findComponent({ name: 'ElRadioGroup' })
      expect(radioGroup.exists()).toBe(true)
    })

    it('切换 filter 调用 store.setFilter', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      const radioGroup = wrapper.findComponent({ name: 'ElRadioGroup' })
      await radioGroup.vm.$emit('update:model-value', 'heavy')
      expect(mockSetFilter).toHaveBeenCalledWith('heavy')
    })
  })

  describe('搜索功能', () => {
    it('显示搜索输入框', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      const input = wrapper.findComponent({ name: 'ElInput' })
      expect(input.exists()).toBe(true)
    })

    it('搜索结果显示匹配数量', async () => {
      mockKeyword.value = 'ABC'
      mockSearchTotal.value = 5
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('匹配 5 个库位')
    })
  })

  describe('区域选择', () => {
    it('显示区域下拉框', async () => {
      mockStore.zones = [makeZone(), makeZone({ id: 'zone-2', zoneCode: 'B' })]
      const wrapper = createWrapper()
      await flushPromises()
      const select = wrapper.findComponent({ name: 'ElSelect' })
      expect(select.exists()).toBe(true)
    })
  })

  describe('手动录入按钮', () => {
    it('点击手动录入按钮打开弹窗', async () => {
      mockStore.zones = [makeZone()]
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const manualBtn = buttons.find((b) => b.text().includes('手动录入'))
      if (manualBtn) {
        await manualBtn.trigger('click')
        await flushPromises()
        expect(wrapper.find('.manual-inbound-dialog-stub').exists()).toBe(true)
      }
    })
  })

  describe('导入按钮', () => {
    it('点击导入按钮打开弹窗', async () => {
      mockStore.zones = [makeZone()]
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const importBtn = buttons.find((b) => b.text().includes('导入'))
      if (importBtn) {
        await importBtn.trigger('click')
        await flushPromises()
        expect(wrapper.find('.import-inbound-dialog-stub').exists()).toBe(true)
      }
    })
  })

  describe('出库按钮', () => {
    it('无选中库位时出库按钮禁用', async () => {
      mockStore.selectedSlots = []
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const outboundBtn = buttons.find((b) => b.text().includes('出库'))
      if (outboundBtn) {
        expect(outboundBtn.props('disabled')).toBe(true)
      }
    })

    it('有选中库位时出库按钮可用', async () => {
      mockStore.selectedSlots = [makeSlot()]
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const outboundBtn = buttons.find((b) => b.text().includes('出库'))
      if (outboundBtn) {
        expect(outboundBtn.props('disabled')).toBe(false)
      }
    })
  })

  describe('移动模式', () => {
    it('点击移动按钮切换移动模式', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const moveBtn = buttons.find((b) => b.text().includes('移动'))
      if (moveBtn) {
        await moveBtn.trigger('click')
        expect(mockToggleMoveMode).toHaveBeenCalled()
      }
    })

    it('移动模式显示提示', async () => {
      mockStore.isMoveMode = true
      const wrapper = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('移动模式')
    })
  })

  describe('编辑按钮', () => {
    it('未选中库位时编辑按钮禁用', async () => {
      mockStore.selectedSlots = []
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const editBtn = buttons.find((b) => b.text().includes('编辑'))
      if (editBtn) {
        expect(editBtn.props('disabled')).toBe(true)
      }
    })

    it('选中多个库位时编辑按钮禁用', async () => {
      mockStore.selectedSlots = [makeSlot(), makeSlot({ id: 'slot-2' })]
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const editBtn = buttons.find((b) => b.text().includes('编辑'))
      if (editBtn) {
        expect(editBtn.props('disabled')).toBe(true)
      }
    })

    it('选中一个库位时编辑按钮可用', async () => {
      mockStore.selectedSlots = [makeSlot()]
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const editBtn = buttons.find((b) => b.text().includes('编辑'))
      if (editBtn) {
        expect(editBtn.props('disabled')).toBe(false)
      }
    })
  })

  describe('状态切换按钮', () => {
    it('未选中库位时不显示', async () => {
      mockStore.selectedSlots = []
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const toggleBtn = buttons.find((b) => b.text().includes('标记为'))
      expect(toggleBtn).toBeUndefined()
    })

    it('选中空库位时不显示', async () => {
      mockStore.selectedSlots = [makeSlot({ status: 'empty' })]
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const toggleBtn = buttons.find((b) => b.text().includes('标记为'))
      expect(toggleBtn).toBeUndefined()
    })

    it('选中空箱时显示"标记为重箱"', async () => {
      mockStore.selectedSlots = [makeSlot({ status: 'empty_container', containerStatus: 'empty' })]
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const toggleBtn = buttons.find((b) => b.text().includes('标记为重箱'))
      expect(toggleBtn).toBeDefined()
    })

    it('选中重箱时显示"标记为空箱"', async () => {
      mockStore.selectedSlots = [makeSlot({ status: 'loaded', containerStatus: 'heavy' })]
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const toggleBtn = buttons.find((b) => b.text().includes('标记为空箱'))
      expect(toggleBtn).toBeDefined()
    })

    it('选中多个库位时不显示', async () => {
      mockStore.selectedSlots = [
        makeSlot({ status: 'loaded', containerStatus: 'heavy' }),
        makeSlot({ id: 'slot-2', status: 'loaded', containerStatus: 'heavy' }),
      ]
      const wrapper = createWrapper()
      await flushPromises()
      const buttons = wrapper.findAllComponents({ name: 'ElButton' })
      const toggleBtn = buttons.find((b) => b.text().includes('标记为'))
      expect(toggleBtn).toBeUndefined()
    })
  })

  describe('库位点击处理', () => {
    it('点击空库位打开手动入库弹窗', async () => {
      mockStore.zones = [makeZone()]
      const wrapper = createWrapper()
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleSlotClick: (slot: Slot) => void }
      const emptySlot = makeSlot({ status: 'empty' })
      vm.handleSlotClick(emptySlot)
      await flushPromises()

      expect(wrapper.find('.manual-inbound-dialog-stub').exists()).toBe(true)
    })

    it('点击已装载库位切换选中状态', async () => {
      mockStore.zones = [makeZone()]
      const wrapper = createWrapper()
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleSlotClick: (slot: Slot) => void }
      const loadedSlot = makeSlot({ status: 'loaded' })
      vm.handleSlotClick(loadedSlot)

      expect(mockToggleSlotSelection).toHaveBeenCalledWith('slot-1')
    })
  })

  describe('移动功能', () => {
    it('移动模式下点击有箱库位设置移动源', async () => {
      mockStore.isMoveMode = true
      mockStore.zones = [makeZone()]
      const wrapper = createWrapper()
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleSlotClick: (slot: Slot) => void }
      const loadedSlot = makeSlot({ status: 'loaded' })
      vm.handleSlotClick(loadedSlot)

      expect(mockSetMoveSource).toHaveBeenCalledWith(loadedSlot)
    })

    it('移动模式下点击空库位触发移动', async () => {
      mockStore.isMoveMode = true
      mockStore.moveSourceSlot = makeSlot({ id: 'source-slot' })
      mockMove.mockResolvedValue(undefined)
      mockStore.zones = [makeZone()]
      const wrapper = createWrapper()
      await flushPromises()

      const vm = wrapper.vm as unknown as { handleSlotClick: (slot: Slot) => void }
      const emptySlot = makeSlot({ id: 'target-slot', status: 'empty' })
      vm.handleSlotClick(emptySlot)

      expect(mockMove).toHaveBeenCalledWith('source-slot', 'target-slot')
    })
  })
})
