export const placeholderSVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNTAgMTAwIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEwMCI+CiAgPHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNjY2NjY2MiPjwvcmVjdD4KPC9zdmc+`

export const isDev = import.meta.env?.DEV || process.env.NODE_ENV === 'development'

const isPreview = process.env.NODE_ENV === 'preview'

export const proxyUrl = 'https://proxy.chilfish.top/?url='
// export const proxyUrl = isDev
//   ? 'http://localhost:8787/?url='
//   : 'https://proxy.chilfish.top/?url='

// export const apiUrl = 'https://tweet-api.chilfish.top'
export const apiUrl = isPreview
  ? 'https://tweet-api-dev.chill4fish.workers.dev/'
  : isDev
    ? '/api'
    : 'https://tweet-api.chilfish.top'

export const staticUrl = isDev
  ? '/static'
  : 'https://p.chilfish.top'

export const notfountRetry = 3

export const fallbackUser = 'ttisrn_0710'
