import { index, type RouteConfig, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('/tweets/:name', 'routes/tweets.tsx'),
] satisfies RouteConfig
