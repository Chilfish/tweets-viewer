import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  ignores: [
    'apps/web-react/build/**',
    'apps/web-react/.react-router/**',
    'apps/server/.output/**',
    'apps/server/.wrangler/**',
    'docs/**',
    'packages/rettiwt-api/**',
    '**/data/**',
    // Agent 工具产物（settings / taste），由工具自身管理，不参与 lint
    '.commandcode/**',
  ],
  rules: {
    'unused-imports/no-unused-vars': 'warn',
    'no-console': 'off',
    'antfu/no-top-level-await': 'off',
    'node/prefer-global/buffer': 'off',
    'node/prefer-global/process': 'off',
    'accessor-pairs': 'off',
    'style/multiline-ternary': 'off',
    'ts/no-use-before-define': 'warn',
    'no-case-declarations': 'off',
    'e18e/prefer-array-fill': 'off',
    // 断言存在性机器化：每条 it 至少一条断言，拦住条件断言 / 裸 expect
    // （防止「测试看起来绿，其实什么都没验」这一类假绿，见 docs/postmortem）
    'test/expect-expect': 'error',
    'test/no-conditional-expect': 'error',
    'test/no-standalone-expect': 'error',
  },
})
