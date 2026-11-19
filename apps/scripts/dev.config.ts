import { defineDevkit } from '@chilfish/devkit'

export const devkit = defineDevkit({
  identity: {
    name: 'ig',
    description: 'Instagram 归档流水线',
    helpHint: 'bun run ig',
  },
  env: {
    file: '.env',
    localFlag: 'LOCAL',
    onlineSuffix: '_REMOTE',
  },
  database: {
    localUrl: 'postgres://postgres@localhost:5432/tweets_dev',
    proxyEndpoint: 'http://127.0.0.1:4444/sql',
    migrations: 'packages/database/migrations',
  },
  storage: {
    bucket: 'tweets-viewer',
    dataDir: 'cache/silo-data',
    publicBaseEnv: 'IG_CDN_BASE',
  },
  paths: { logs: 'logs' },
  dev: {
    servers: [
      {
        name: 'server',
        runtime: 'bun',
        command: '--cwd',
        args: ['apps/server', 'dev'],
      },
      {
        name: 'client',
        runtime: 'bun',
        command: '--cwd',
        args: ['apps/web-react', 'dev'],
      },
    ],
  },
})
