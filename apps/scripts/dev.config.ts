import { defineDevkit } from '@chilfish/devkit'

export const devkit = defineDevkit({
  identity: {
    name: 'ig',
    description: 'Instagram 归档流水线',
    helpHint: 'bun run ig',
  },
  env: {
    // 基础文件 + 模式文件：LOCAL=1 叠加 .env.dev，否则叠加 .env.prod。
    file: '.env',
    localFlag: 'LOCAL',
  },
  database: {
    localUrl: 'postgres://postgres@localhost:5432/tweets_dev',
    // 4444 常被同机的其他 devkit 项目占用；本项目固定 4445，避免代理连错库。
    proxyEndpoint: 'http://127.0.0.1:4445/sql',
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
