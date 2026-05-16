import { computed } from 'vue'
import type { FormRules } from 'element-plus'
import type { OrderFormState } from './useOrderForm'

export function useOrderFormRules(form: OrderFormState) {
  return computed<FormRules>(() => ({
    containerNo: [
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          if (!value) return callback()
          if (!/^[A-Z]{4}\d{7}$/.test(value)) {
            callback(new Error('箱号格式：4位大写字母 + 7位数字'))
          } else {
            callback()
          }
        },
        trigger: 'blur',
      },
    ],
    destName: [
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          if (form.originName && value && form.originName === value) {
            callback(new Error('起运地和目的地不能相同'))
          } else {
            callback()
          }
        },
        trigger: 'blur',
      },
    ],
    originName: [
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          if (value && form.destName && value === form.destName) {
            callback(new Error('起运地和目的地不能相同'))
          } else {
            callback()
          }
        },
        trigger: 'blur',
      },
    ],
  }))
}