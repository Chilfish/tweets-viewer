import {
  index,
  layout,
  type RouteConfig,
  route,
} from '@react-router/dev/routes'

export default [
  layout('./components/layout/layout.tsx', [
    index('routes/home.tsx'),
    route('/tweets/:name', 'routes/tweets.tsx'),
  ]),
] satisfies RouteConfig
