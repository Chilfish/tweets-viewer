import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Vite 8 原生支持 tsconfig paths 解析，无需 vite-tsconfig-paths 插件
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // coverage 是根级配置，对两个项目生效（v8，@vitest/coverage-v8）
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/components/**', 'app/lib/**', 'app/store/**'],
      exclude: ['app/components/ui/**', '**/__tests__/**'],
    },
    projects: [
      {
        // 常规单元 + 组件测试
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./app/test/setup.ts'],
          include: [
            'app/store/__tests__/**/*.test.ts',
            'app/lib/__tests__/**/*.test.ts',
            'app/components/**/*.test.tsx',
          ],
        },
      },
      {
        // Storybook portable stories 测试（addon-vitest）
        // story glob 取自 .storybook/main.ts；plugin 会覆盖本项目的 include
        resolve: {
          tsconfigPaths: true,
        },
        plugins: [storybookTest()],
        test: {
          name: 'stories',
          environment: 'jsdom',
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
})
