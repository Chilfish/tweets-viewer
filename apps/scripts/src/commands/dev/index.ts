import type { CliGroup } from '../../cli/runtime'
import { devDbSpec } from './db'
import { devProxySpec } from './proxy'
import { devStorageSpec } from './storage'

export const devGroup: CliGroup = {
  name: 'dev',
  description: '本地环境：Postgres、Neon HTTP 代理与对象存储',
  commands: [devDbSpec, devProxySpec, devStorageSpec],
}
