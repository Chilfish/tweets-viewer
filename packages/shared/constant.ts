export const isDev
  = import.meta.env?.DEV || process.env.NODE_ENV === 'development'

const isPreview = process.env.NODE_ENV === 'preview'

export const proxyUrl = 'https://proxy.chilfish.top/?url='
// export const proxyUrl = isDev
//   ? 'http://localhost:8787/?url='
//   : 'https://proxy.chilfish.top/?url='

// export const apiUrl = 'https://tweet-api-dev.chill4fish.workers.dev'
export const apiUrl = isPreview
  ? 'https://tweet-api-dev.chill4fish.workers.dev'
  : isDev
    ? 'http://localhost:3000'
    : 'https://tweet-api.chilfish.top'

export const staticUrl = isDev ? '/static' : 'https://p.chilfish.top'

export const notfountRetry = 3

export const fallbackUser = 'ttisrn_0710'

export const PAGE_SIZE = 15
