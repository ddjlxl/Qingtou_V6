import { describe, it, expect } from 'vitest'
import type { FormItemRule } from 'element-plus'
import { createInitialFormState } from '../composables/useOrderFormHelpers'
import { useOrderFormRules } from '../composables/useOrderFormRules'

function getFirstRule(rules: ReturnType<typeof useOrderFormRules>, key: string): FormItemRule {
  return (rules.value[key] as FormItemRule[])[0]
}

describe('useOrderFormRules', () => {
  describe('containerNo rule', () => {
    it('accepts empty value', () => {
      const form = createInitialFormState()
      const rules = useOrderFormRules(form)
      const containerNoRule = getFirstRule(rules, 'containerNo')

      return new Promise<void>((resolve) => {
        containerNoRule.validator!({}, '', (error?: string | Error) => {
          expect(error).toBeUndefined()
          resolve()
        }, {}, {})
      })
    })

    it('accepts valid container number', () => {
      const form = createInitialFormState()
      const rules = useOrderFormRules(form)
      const containerNoRule = getFirstRule(rules, 'containerNo')

      return new Promise<void>((resolve) => {
        containerNoRule.validator!({}, 'ABCD1234567', (error?: string | Error) => {
          expect(error).toBeUndefined()
          resolve()
        }, {}, {})
      })
    })

    it('rejects invalid format - too few letters', () => {
      const form = createInitialFormState()
      const rules = useOrderFormRules(form)
      const containerNoRule = getFirstRule(rules, 'containerNo')

      return new Promise<void>((resolve) => {
        containerNoRule.validator!({}, 'ABC1234567', (error?: string | Error) => {
          expect(error).toBeDefined()
          expect((error as Error).message).toContain('箱号格式')
          resolve()
        }, {}, {})
      })
    })

    it('rejects invalid format - too few digits', () => {
      const form = createInitialFormState()
      const rules = useOrderFormRules(form)
      const containerNoRule = getFirstRule(rules, 'containerNo')

      return new Promise<void>((resolve) => {
        containerNoRule.validator!({}, 'ABCD123456', (error?: string | Error) => {
          expect(error).toBeDefined()
          expect((error as Error).message).toContain('箱号格式')
          resolve()
        }, {}, {})
      })
    })

    it('rejects lowercase letters', () => {
      const form = createInitialFormState()
      const rules = useOrderFormRules(form)
      const containerNoRule = getFirstRule(rules, 'containerNo')

      return new Promise<void>((resolve) => {
        containerNoRule.validator!({}, 'abcd1234567', (error?: string | Error) => {
          expect(error).toBeDefined()
          expect((error as Error).message).toContain('箱号格式')
          resolve()
        }, {}, {})
      })
    })
  })

  describe('destName rule', () => {
    it('accepts when origin and dest are different', () => {
      const form = createInitialFormState()
      form.originName = '上海港'
      const rules = useOrderFormRules(form)
      const destRule = getFirstRule(rules, 'destName')

      return new Promise<void>((resolve) => {
        destRule.validator!({}, '昆山工厂', (error?: string | Error) => {
          expect(error).toBeUndefined()
          resolve()
        }, {}, {})
      })
    })

    it('rejects when origin and dest are same', () => {
      const form = createInitialFormState()
      form.originName = '上海港'
      const rules = useOrderFormRules(form)
      const destRule = getFirstRule(rules, 'destName')

      return new Promise<void>((resolve) => {
        destRule.validator!({}, '上海港', (error?: string | Error) => {
          expect(error).toBeDefined()
          expect((error as Error).message).toContain('不能相同')
          resolve()
        }, {}, {})
      })
    })

    it('accepts empty dest when origin is set', () => {
      const form = createInitialFormState()
      form.originName = '上海港'
      const rules = useOrderFormRules(form)
      const destRule = getFirstRule(rules, 'destName')

      return new Promise<void>((resolve) => {
        destRule.validator!({}, '', (error?: string | Error) => {
          expect(error).toBeUndefined()
          resolve()
        }, {}, {})
      })
    })
  })

  describe('originName rule', () => {
    it('accepts when origin and dest are different', () => {
      const form = createInitialFormState()
      form.destName = '昆山工厂'
      const rules = useOrderFormRules(form)
      const originRule = getFirstRule(rules, 'originName')

      return new Promise<void>((resolve) => {
        originRule.validator!({}, '上海港', (error?: string | Error) => {
          expect(error).toBeUndefined()
          resolve()
        }, {}, {})
      })
    })

    it('rejects when origin and dest are same', () => {
      const form = createInitialFormState()
      form.destName = '上海港'
      const rules = useOrderFormRules(form)
      const originRule = getFirstRule(rules, 'originName')

      return new Promise<void>((resolve) => {
        originRule.validator!({}, '上海港', (error?: string | Error) => {
          expect(error).toBeDefined()
          expect((error as Error).message).toContain('不能相同')
          resolve()
        }, {}, {})
      })
    })
  })
})
