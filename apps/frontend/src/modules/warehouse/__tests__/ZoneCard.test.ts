import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ZoneCard from '../components/ZoneCard.vue'
import type { Zone, Slot } from '../types'

function makeSlot(overrides: Record<string, unknown> = {}): Slot {
  return {
    id: 'slot-1',
    zoneCode: 'A',
    slotNo: 'A-01-01',
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

function makeZone(overrides: Record<string, unknown> = {}): Zone {
  return {
    id: 'zone-1',
    name: 'A区',
    zoneCode: 'A',
    sortOrder: 1,
    usedCount: 0,
    totalCount: 10,
    slots: [],
    ...overrides,
  }
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(ZoneCard, {
    props: {
      zone: makeZone(),
      filter: 'all',
      selectedSlotIds: new Set<string>(),
      ...props,
    },
    global: {
      stubs: {
        SlotCell: {
          template: `
            <div 
              class="slot-cell-stub" 
              :data-slot-id="slotData.id"
              :data-status="slotData.status"
              :data-selected="selected"
              :data-is-move-source="isMoveSource"
              :data-is-move-target="isMoveTarget"
              :data-is-search-hit="isSearchHit"
              :data-visible="visible"
              @click="$emit('click', slotData)"
            >
              {{ slotData.slotNo }}
            </div>
          `,
          props: ['slotData', 'selected', 'isMoveSource', 'isMoveTarget', 'isSearchHit', 'visible'],
          emits: ['click'],
        },
      },
    },
  })
}

describe('ZoneCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('正常渲染', () => {
    it('显示区域名称', () => {
      const wrapper = createWrapper({
        zone: makeZone({ zoneCode: 'A' }),
      })
      expect(wrapper.text()).toContain('A 区')
    })

    it('显示使用率统计', () => {
      const wrapper = createWrapper({
        zone: makeZone({ usedCount: 5, totalCount: 10 }),
      })
      expect(wrapper.text()).toContain('(5/10)')
    })

    it('显示库位网格', () => {
      const slots = [
        makeSlot({ id: 'slot-1', slotNo: 'A-01-01' }),
        makeSlot({ id: 'slot-2', slotNo: 'A-01-02' }),
        makeSlot({ id: 'slot-3', slotNo: 'A-01-03' }),
      ]
      const wrapper = createWrapper({
        zone: makeZone({ slots }),
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      expect(slotCells).toHaveLength(3)
    })

    it('显示搜索匹配数量', () => {
      const wrapper = createWrapper({
        zone: makeZone(),
        searchMatchCount: 5,
      })
      expect(wrapper.text()).toContain('匹配 5')
    })

    it('不显示搜索匹配数量当为 0', () => {
      const wrapper = createWrapper({
        zone: makeZone(),
        searchMatchCount: 0,
      })
      expect(wrapper.text()).not.toContain('匹配')
    })
  })

  describe('空状态', () => {
    it('区域无库位时显示空网格', () => {
      const wrapper = createWrapper({
        zone: makeZone({ slots: [] }),
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      expect(slotCells).toHaveLength(0)
    })

    it('区域无库位时显示使用率为 0', () => {
      const wrapper = createWrapper({
        zone: makeZone({ usedCount: 0, totalCount: 10, slots: [] }),
      })
      expect(wrapper.text()).toContain('(0/10)')
    })
  })

  describe('库位状态过滤', () => {
    it('filter=all 时显示所有库位', () => {
      const slots = [
        makeSlot({ id: 'slot-1', status: 'empty' }),
        makeSlot({ id: 'slot-2', status: 'loaded' }),
        makeSlot({ id: 'slot-3', status: 'empty_container' }),
      ]
      const wrapper = createWrapper({
        zone: makeZone({ slots }),
        filter: 'all',
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      expect(slotCells).toHaveLength(3)
    })

    it('filter=heavy 时只显示 loaded 状态库位', () => {
      const slots = [
        makeSlot({ id: 'slot-1', status: 'empty' }),
        makeSlot({ id: 'slot-2', status: 'loaded' }),
        makeSlot({ id: 'slot-3', status: 'empty_container' }),
      ]
      const wrapper = createWrapper({
        zone: makeZone({ slots }),
        filter: 'heavy',
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      expect(slotCells).toHaveLength(3)
      const visibleSlots = slotCells.filter((s) => s.attributes('data-visible') !== 'false')
      expect(visibleSlots.length).toBe(1)
    })

    it('filter=empty 时只显示 empty_container 状态库位', () => {
      const slots = [
        makeSlot({ id: 'slot-1', status: 'empty' }),
        makeSlot({ id: 'slot-2', status: 'loaded' }),
        makeSlot({ id: 'slot-3', status: 'empty_container' }),
      ]
      const wrapper = createWrapper({
        zone: makeZone({ slots }),
        filter: 'empty',
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      expect(slotCells).toHaveLength(3)
    })

    it('filter=empty_slot 时只显示 empty 状态库位', () => {
      const slots = [
        makeSlot({ id: 'slot-1', status: 'empty' }),
        makeSlot({ id: 'slot-2', status: 'loaded' }),
        makeSlot({ id: 'slot-3', status: 'empty_container' }),
      ]
      const wrapper = createWrapper({
        zone: makeZone({ slots }),
        filter: 'empty_slot',
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      expect(slotCells).toHaveLength(3)
    })
  })

  describe('点击库位', () => {
    it('点击库位触发 slotClick 事件', async () => {
      const slot1 = makeSlot({ id: 'slot-1', slotNo: 'A-01-01' })
      const wrapper = createWrapper({
        zone: makeZone({ slots: [slot1] }),
      })
      const slotCell = wrapper.find('.slot-cell-stub')
      await slotCell.trigger('click')
      expect(wrapper.emitted('slotClick')).toBeTruthy()
      expect(wrapper.emitted('slotClick')![0][0]).toEqual(slot1)
    })

    it('点击多个库位分别触发事件', async () => {
      const slot1 = makeSlot({ id: 'slot-1' })
      const slot2 = makeSlot({ id: 'slot-2' })
      const wrapper = createWrapper({
        zone: makeZone({ slots: [slot1, slot2] }),
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      await slotCells[0].trigger('click')
      await slotCells[1].trigger('click')
      expect(wrapper.emitted('slotClick')).toHaveLength(2)
    })
  })

  describe('选中状态', () => {
    it('传递 selected 属性给 SlotCell', () => {
      const slot1 = makeSlot({ id: 'slot-1' })
      const slot2 = makeSlot({ id: 'slot-2' })
      const wrapper = createWrapper({
        zone: makeZone({ slots: [slot1, slot2] }),
        selectedSlotIds: new Set(['slot-1']),
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      expect(slotCells[0].attributes('data-selected')).toBe('true')
      expect(slotCells[1].attributes('data-selected')).toBe('false')
    })
  })

  describe('移动模式', () => {
    it('传递 isMoveSource 属性给移动源库位', () => {
      const slot1 = makeSlot({ id: 'slot-1' })
      const slot2 = makeSlot({ id: 'slot-2' })
      const wrapper = createWrapper({
        zone: makeZone({ slots: [slot1, slot2] }),
        moveSourceId: 'slot-1',
        isMoveMode: true,
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      expect(slotCells[0].attributes('data-is-move-source')).toBe('true')
      expect(slotCells[1].attributes('data-is-move-source')).toBe('false')
    })

    it('传递 isMoveTarget 属性给空库位', () => {
      const slot1 = makeSlot({ id: 'slot-1', status: 'empty' })
      const slot2 = makeSlot({ id: 'slot-2', status: 'loaded' })
      const wrapper = createWrapper({
        zone: makeZone({ slots: [slot1, slot2] }),
        moveSourceId: 'slot-0',
        isMoveMode: true,
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      expect(slotCells[0].attributes('data-is-move-target')).toBe('true')
      expect(slotCells[1].attributes('data-is-move-target')).toBe('false')
    })
  })

  describe('搜索高亮', () => {
    it('传递 isSearchHit 属性给匹配库位', () => {
      const slot1 = makeSlot({ id: 'slot-1' })
      const slot2 = makeSlot({ id: 'slot-2' })
      const wrapper = createWrapper({
        zone: makeZone({ slots: [slot1, slot2] }),
        searchHitIds: new Set(['slot-1']),
      })
      const slotCells = wrapper.findAll('.slot-cell-stub')
      expect(slotCells[0].attributes('data-is-search-hit')).toBe('true')
      expect(slotCells[1].attributes('data-is-search-hit')).toBe('false')
    })
  })

  describe('Props 变化', () => {
    it('zone 数据变化时组件正确更新', async () => {
      const wrapper = createWrapper({
        zone: makeZone({ zoneCode: 'A', usedCount: 5, totalCount: 10 }),
      })
      expect(wrapper.text()).toContain('A 区')
      expect(wrapper.text()).toContain('(5/10)')

      await wrapper.setProps({
        zone: makeZone({ zoneCode: 'B', usedCount: 8, totalCount: 20 }),
      })
      expect(wrapper.text()).toContain('B 区')
      expect(wrapper.text()).toContain('(8/20)')
    })

    it('filter 变化时正确过滤库位', async () => {
      const slots = [
        makeSlot({ id: 'slot-1', status: 'empty' }),
        makeSlot({ id: 'slot-2', status: 'loaded' }),
      ]
      const wrapper = createWrapper({
        zone: makeZone({ slots }),
        filter: 'all',
      })
      expect(wrapper.findAll('.slot-cell-stub')).toHaveLength(2)

      await wrapper.setProps({ filter: 'heavy' })
      expect(wrapper.findAll('.slot-cell-stub')).toHaveLength(2)
    })

    it('selectedSlotIds 变化时正确更新选中状态', async () => {
      const slot1 = makeSlot({ id: 'slot-1' })
      const wrapper = createWrapper({
        zone: makeZone({ slots: [slot1] }),
        selectedSlotIds: new Set<string>(),
      })
      const slotCell = wrapper.find('.slot-cell-stub')
      expect(slotCell.attributes('data-selected')).toBe('false')

      await wrapper.setProps({ selectedSlotIds: new Set(['slot-1']) })
      expect(slotCell.attributes('data-selected')).toBe('true')
    })
  })
})
