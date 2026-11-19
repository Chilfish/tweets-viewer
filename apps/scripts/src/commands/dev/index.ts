import type { CliGroup } from '../../cli/runtime'
import { devDbSpec } from './db'
import { devProxySpec } from './proxy'

export const devGroup: CliGroup = {
  name: 'dev',
  description: '本地环境：Postgres 初始化与 Neon HTTP 代理',
  commands: [devDbSpec, devProxySpec],
}
