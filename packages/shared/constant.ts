export const isDev
  = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV || process.env.NODE_ENV === 'development'

const isPreview = process.env.NODE_ENV === 'preview'

export const proxyUrl = 'https://proxy.chilfish.top/?url='
// export const proxyUrl = isDev
//   ? 'http://localhost:8787/?url='
//   : 'https://proxy.chilfish.top/?url='

// export const apiUrl = 'https://tweet-api-dev.chill4fish.workers.dev'
// apiUrl 优先取自环境变量：
//   1. build 时由 vite.config.ts 注入的 `import.meta.env.VITE_API_URL`（web-react 客户端/SSR）
//   2. `process.env.API_URL`（Node/脚本等非 Vite 上下文）
//   3. 回退到旧的 preview/dev/prod 判定（storybook / vitest 等未注入环境
//   时保持原行为）
const injectedApiUrl = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_API_URL
export const apiUrl = injectedApiUrl
  ?? process.env.API_URL
  ?? (isPreview
    ? 'https://tweet-api-dev.chill4fish.workers.dev'
    : isDev
      ? 'http://localhost:3000'
      : 'https://tweet-api.chilfish.top')

export const staticUrl = isDev ? '/static' : 'https://p.chilfish.top'

export const notfountRetry = 3

export const fallbackUser = 'ttisrn_0710'

export const PAGE_SIZE = 15
