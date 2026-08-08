import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Vite 8 原生支持 tsconfig paths 解析，无需 vite-tsconfig-paths 插件
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['app/store/__tests__/**/*.test.ts', 'app/lib/__tests__/**/*.test.ts'],
  },
})
