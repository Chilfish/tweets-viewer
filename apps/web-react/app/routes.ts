import type { RouteConfig } from '@react-router/dev/routes'
import {
  index,
  layout,
  route,

} from '@react-router/dev/routes'

export default [
  layout('./components/layout/layout.tsx', [
    index('routes/home.tsx'),
    route('/tweets/:name', 'routes/tweets.tsx'),
    route('/tweets/v3/:name', 'routes/tweets-v3.tsx'),
    route('/search/:name', 'routes/search.tsx'),
    route('/memo/:name', 'routes/memo.tsx'),
    route('/media/:name', 'routes/media.tsx'),
    route('/ins/:name', 'routes/ins.tsx'),
  ]),
] satisfies RouteConfig
