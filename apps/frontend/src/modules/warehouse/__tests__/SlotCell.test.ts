import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SlotCell from '../components/SlotCell.vue'
import type { Slot } from '../types'

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

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(SlotCell, {
    props: {
      slotData: makeSlot(),
      ...props,
    },
  })
}

describe('SlotCell', () => {
  describe('空库位状态', () => {
    it('显示 slotNo 作为 title', () => {
      const wrapper = createWrapper({
        slotData: makeSlot({ slotNo: 'A-01-01', containerNo: null }),
      })
      expect(wrapper.attributes('title')).toBe('A-01-01')
    })

    it('应用 slot--empty 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot({ status: 'empty' }),
      })
      expect(wrapper.classes()).toContain('slot--empty')
    })

    it('不显示状态标签', () => {
      const wrapper = createWrapper({
        slotData: makeSlot({ status: 'empty' }),
      })
      const label = wrapper.find('.slot-cell__label')
      expect(label.text()).toBe('')
    })
  })

  describe('已装载状态', () => {
    it('显示 containerNo 作为 title', () => {
      const wrapper = createWrapper({
        slotData: makeSlot({ status: 'loaded', containerNo: 'CONT123' }),
      })
      expect(wrapper.attributes('title')).toBe('CONT123')
    })

    it('应用 slot--loaded 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot({ status: 'loaded' }),
      })
      expect(wrapper.classes()).toContain('slot--loaded')
    })

    it('显示"重"标签', () => {
      const wrapper = createWrapper({
        slotData: makeSlot({ status: 'loaded', containerStatus: 'heavy' }),
      })
      const label = wrapper.find('.slot-cell__label')
      expect(label.text()).toBe('重')
    })
  })

  describe('空箱状态', () => {
    it('显示 containerNo 作为 title', () => {
      const wrapper = createWrapper({
        slotData: makeSlot({ status: 'empty_container', containerNo: 'CONT456' }),
      })
      expect(wrapper.attributes('title')).toBe('CONT456')
    })

    it('应用 slot--empty-container 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot({ status: 'empty_container' }),
      })
      expect(wrapper.classes()).toContain('slot--empty-container')
    })

    it('显示"空"标签', () => {
      const wrapper = createWrapper({
        slotData: makeSlot({ status: 'empty_container', containerStatus: 'empty' }),
      })
      const label = wrapper.find('.slot-cell__label')
      expect(label.text()).toBe('空')
    })
  })

  describe('点击事件', () => {
    it('点击时触发 click 事件', async () => {
      const slot = makeSlot({ id: 'slot-1' })
      const wrapper = createWrapper({ slotData: slot })
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toBeTruthy()
      expect(wrapper.emitted('click')![0][0]).toEqual(slot)
    })

    it('visible=false 时不触发点击事件', async () => {
      const slot = makeSlot({ id: 'slot-1' })
      const wrapper = createWrapper({ slotData: slot, visible: false })
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toBeFalsy()
    })

    it('visible=true 时触发点击事件', async () => {
      const slot = makeSlot({ id: 'slot-1' })
      const wrapper = createWrapper({ slotData: slot, visible: true })
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toBeTruthy()
    })
  })

  describe('选中状态', () => {
    it('selected=true 时应用 slot--selected 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot(),
        selected: true,
      })
      expect(wrapper.classes()).toContain('slot--selected')
    })

    it('selected=false 时不应用 slot--selected 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot(),
        selected: false,
      })
      expect(wrapper.classes()).not.toContain('slot--selected')
    })

    it('selected=true 时显示勾选标记', () => {
      const wrapper = createWrapper({
        slotData: makeSlot(),
        selected: true,
      })
      const check = wrapper.find('.slot-cell__check')
      expect(check.exists()).toBe(true)
    })

    it('selected=false 时不显示勾选标记', () => {
      const wrapper = createWrapper({
        slotData: makeSlot(),
        selected: false,
      })
      const check = wrapper.find('.slot-cell__check')
      expect(check.exists()).toBe(false)
    })
  })

  describe('移动模式', () => {
    it('isMoveSource=true 时应用 slot--move-source 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot(),
        isMoveSource: true,
      })
      expect(wrapper.classes()).toContain('slot--move-source')
    })

    it('isMoveTarget=true 时应用 slot--move-target 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot(),
        isMoveTarget: true,
      })
      expect(wrapper.classes()).toContain('slot--move-target')
    })
  })

  describe('搜索高亮', () => {
    it('isSearchHit=true 时应用 slot--search-hit 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot(),
        isSearchHit: true,
      })
      expect(wrapper.classes()).toContain('slot--search-hit')
    })

    it('isSearchHit=false 时不应用 slot--search-hit 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot(),
        isSearchHit: false,
      })
      expect(wrapper.classes()).not.toContain('slot--search-hit')
    })
  })

  describe('隐藏状态', () => {
    it('visible=false 时应用 slot--hidden 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot(),
        visible: false,
      })
      expect(wrapper.classes()).toContain('slot--hidden')
    })

    it('visible=true 时不应用 slot--hidden 类', () => {
      const wrapper = createWrapper({
        slotData: makeSlot(),
        visible: true,
      })
      expect(wrapper.classes()).not.toContain('slot--hidden')
    })

    it('visible=false 时 title 为空', () => {
      const wrapper = createWrapper({
        slotData: makeSlot({ containerNo: 'CONT123' }),
        visible: false,
      })
      expect(wrapper.attributes('title')).toBe('')
    })
  })

  describe('Props 默认值', () => {
    it('selected 默认为 false', () => {
      const wrapper = createWrapper()
      expect(wrapper.classes()).not.toContain('slot--selected')
    })

    it('isMoveSource 默认为 false', () => {
      const wrapper = createWrapper()
      expect(wrapper.classes()).not.toContain('slot--move-source')
    })

    it('isMoveTarget 默认为 false', () => {
      const wrapper = createWrapper()
      expect(wrapper.classes()).not.toContain('slot--move-target')
    })

    it('isSearchHit 默认为 false', () => {
      const wrapper = createWrapper()
      expect(wrapper.classes()).not.toContain('slot--search-hit')
    })

    it('visible 默认为 true', () => {
      const wrapper = createWrapper()
      expect(wrapper.classes()).not.toContain('slot--hidden')
    })
  })
})
