import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,
  formatters: true,
  rules: {
    'no-console': 'off',
    'unused-imports/no-unused-vars': 'warn',
    'vue/no-multiple-template-root': 'off',
    'node/prefer-global/process': 'off',
  },
})
