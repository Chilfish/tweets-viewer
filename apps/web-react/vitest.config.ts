import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { defaultExclude, defineConfig } from 'vitest/config'

// 视觉回归用例命名约定：*.vrt.test.tsx（与 unit/stories 物理隔离，见 postmortem 002 的 projects 拆分纪律）
const vrtPattern = '**/*.vrt.test.tsx'

export default defineConfig({
  // Vite 8 原生支持 tsconfig paths 解析，无需 vite-tsconfig-paths 插件
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // coverage 是根级配置，对所有 project 生效（v8，@vitest/coverage-v8）
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
          // *.vrt.test.tsx 会被上面的 *.test.tsx 误匹配（jsdom 里没有 toMatchScreenshot），必须显式排除
          exclude: [vrtPattern, ...defaultExclude],
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
      {
        // 视觉回归测试（VRT）：真实 Chromium headless 截图 + toMatchScreenshot 基线比对
        // 不带 storybookTest 插件（002 铁律：会接管 include 的插件只进自己的 project）
        // tailwindcss 插件必须有：app.css 的 @import 'tailwindcss' 需要它处理，否则截图无真实样式
        resolve: {
          tsconfigPaths: true,
        },
        plugins: [tailwindcss()],
        // 与 app 的 vite.config.ts 同源：注入 VITE_API_URL 让 shared/constant.ts 的
        // `?? process.env.API_URL` 短路（浏览器 iframe 里没有 process，vrt 用例不发请求，值本身无关紧要）
        define: {
          'import.meta.env.VITE_API_URL': JSON.stringify('https://tweet-api.chilfish.top'),
        },
        test: {
          name: 'vrt',
          include: ['app/**/*.vrt.test.tsx'],
          setupFiles: ['./app/test/vrt-setup.ts'],
          // 截图前有稳定性探测重试，5s 默认值不够
          testTimeout: 30_000,
          browser: {
            // v4 关键项：browser 配置默认 enabled: false，不显式打开不会切到 browser pool
            // （会落到 forks pool 并报「vitest/browser can be imported only inside the Browser Mode」）
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [
              { browser: 'chromium', viewport: { width: 1280, height: 720 } },
            ],
            expect: {
              toMatchScreenshot: {
                comparatorOptions: {
                  // 1% 像素容差：抗亚像素/字体渲染噪声；真回归（布局/配色漂移）远超此阈值
                  allowedMismatchedPixelRatio: 0.01,
                },
              },
            },
          },
        },
      },
    ],
  },
})
