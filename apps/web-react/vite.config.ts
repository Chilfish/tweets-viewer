import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import babel from 'vite-plugin-babel'

// 获取 git 信息
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
    }).trim()
    const commitDate = execSync('git log -1 --format=%ci', {
      encoding: 'utf8',
    }).trim()
    return {
      hash: commitHash,
      date: commitDate,
    }
  }
  catch (error) {
    console.warn('Failed to get git info:', error)
    return {
      hash: 'unknown',
      date: 'unknown',
    }
  }
}

const gitInfo = getGitInfo()

// 前端 API 基址：优先取仓库根 `.env` 中的 `API_URL`（与 env.server.ts 同源），
// 回退到生产默认值。dev 模式由 localhost:3000 反代本地 API server。
const mode = process.env.NODE_ENV ?? 'production'
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const loadedEnv = loadEnv(mode, repoRoot, '')
const resolvedApiUrl = loadedEnv.API_URL ?? 'https://tweet-api.chilfish.top'

const babelInclude = /\.[jt]sx?$/
const ReactCompilerConfig = { /* ... */ }

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    babel({
      include: babelInclude,
      exclude: /node_modules/,
      babelConfig: {
        presets: ['@babel/preset-typescript'],
        plugins: [
          '@babel/plugin-syntax-jsx',
          ['babel-plugin-react-compiler', ReactCompilerConfig],
        ],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: [
      // base-ui
      '@base-ui/react/avatar',
      '@base-ui/react/dialog',
      '@base-ui/react/field',
      '@base-ui/react/input',
      '@base-ui/react/menu',
      '@base-ui/react/merge-props',
      '@base-ui/react/popover',
      '@base-ui/react/scroll-area',
      '@base-ui/react/tabs',
      '@base-ui/react/use-render',
      // utilities
      'axios',
      'class-variance-authority',
      'clsx',
      'date-fns',
      'lucide-react',
      'react/compiler-runtime',
      'spin-delay',
      'tailwind-merge',
      'zustand',
      'zustand/middleware',
      'zustand/react/shallow',
    ],
  },
  server: {
    port: 9080,
    host: '127.0.0.1',
    allowedHosts: true,
    proxy: {
      '/static': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/static/, ''),
      },
      '/api': {
        target: resolvedApiUrl,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  define: {
    '__GIT_HASH__': JSON.stringify(gitInfo.hash),
    '__GIT_DATE__': JSON.stringify(gitInfo.date),
    // 把 API 基址注入到客户端/SSR bundle，供 `constant.ts` 的
    // `import.meta.env.VITE_API_URL` 读取，避免前端写死 apiUrl
    'import.meta.env.VITE_API_URL': JSON.stringify(resolvedApiUrl),
  },
})
