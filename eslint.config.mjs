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
    // expectScreenshot 是 toMatchScreenshot 的带遮罩封装（app/test/vrt.tsx），
    // 与 expect 一样属于断言，加入白名单避免误报「Test has no assertions」
    'test/expect-expect': [
      'error',
      {
        assertFunctionNames: ['expect', 'expectScreenshot'],
      },
    ],
    'test/no-conditional-expect': 'error',
    'test/no-standalone-expect': 'error',
  },
})
