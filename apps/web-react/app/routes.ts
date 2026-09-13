import type { RouteConfig } from '@react-router/dev/routes'
import {
  index,
  layout,
  route,
} from '@react-router/dev/routes'

export default [
  layout('./components/layout/layout.tsx', { id: 'rootLayout' }, [
    index('routes/home.tsx'),
    route('/tweets/:name', 'routes/tweets.tsx'),
    route('/memo/:name?', 'routes/last-years-today.tsx'),
    route('/search/:name?', 'routes/search.tsx'),
    route('/media/:name', 'routes/media.tsx'),
    route('/ins/:name', 'routes/ins.tsx'),
  ]),

  // 机器可读资源路由（不套 layout，直接返回 Response）
  route('robots.txt', 'routes/robots.txt.ts'),
  route('sitemap.xml', 'routes/sitemap.xml.ts'),
  route('llms.txt', 'routes/llms.txt.ts'),
] satisfies RouteConfig
