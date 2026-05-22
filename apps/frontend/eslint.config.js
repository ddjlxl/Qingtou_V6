import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'error',
      'vue/multi-word-component-names': 'off',
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
  {
    files: [
      'src/modules/dispatch/components/OrderFormDialog.vue',
      'src/modules/dispatch/components/OrderTable.vue',
      'src/modules/dispatch/stores/useDispatchStore.ts',
      'src/modules/driver/stores/useDriverStore.ts',
      'src/modules/fleet/components/TransportRecordManagement.vue',
      'src/modules/fleet/stores/useFleetStore.ts',
    ],
    rules: {
      'max-lines': 'warn',
      'max-lines-per-function': 'off',
    },
  },
)
