import { Archive, Database, Eye, RefreshCw } from 'lucide-react'
import { Link } from 'react-router'

export function meta() {
  return [
    { title: '关于这个归档 · Tweets Viewer' },
    {
      name: 'description',
      content: '关于这个归档阅读器：数据来源、更新频率、隐私承诺与技术实现。',
    },
  ]
}

export const handle = {
  isWide: false,
}

const facts = [
  {
    icon: Archive,
    title: '完整人生归档',
    body: '把一个人的网络人生（Twitter + Instagram）离线归档，随时翻阅。时间线、媒体墙、搜索与每年今日的回忆——纯只读，不依赖实时网络。',
  },
  {
    icon: Database,
    title: '数据来源',
    body: '推文与 Instagram 帖子来自离线归档抓取，存储于 Neon PostgreSQL（结构化列 + 完整 JSON）。前端只读数据，绝不写入。',
  },
  {
    icon: RefreshCw,
    title: '每日更新',
    body: 'GitHub Actions 每日定时（北京时间 00:00）增量同步 Twitter 与 Instagram 数据，归档持续补全。',
  },
  {
    icon: Eye,
    title: '隐私承诺',
    body: '无登录、无追踪、无社交交互。你的浏览只发生在浏览器与归档数据之间；URL 即书签，状态可分享。',
  },
]

export default function AboutPage() {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-10 px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-linear-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          关于这个归档
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          推文归档阅读器 —— 把完整的网络人生，装进可以随时翻阅的抽屉
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {facts.map(fact => (
          <section
            key={fact.title}
            className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card p-5"
          >
            <div className="flex items-center gap-2.5">
              <fact.icon className="size-5 text-primary" />
              <h2 className="text-base font-semibold">{fact.title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{fact.body}</p>
          </section>
        ))}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card p-5">
        <h2 className="text-base font-semibold">技术实现</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          URL 驱动状态（状态即文件系统，可书签可分享）、keyset 游标分页（无限滚动不随页码退化）、
          服务端驱动分页元数据、双层缓存（服务端 LRU + 客户端响应缓存）、SPA-first 渲染。
          前端 React 19 + React Router，API 为 Hono + Cloudflare Workers。
        </p>
      </section>

      <footer className="text-center text-xs text-muted-foreground/70">
        <p>
          一个由
          {' '}
          <a
            href="https://github.com/Chilfish"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/80 hover:text-primary transition-colors"
          >
            @Chilfish
          </a>
          {' '}
          维护的归档项目 ·
          <Link to="/" className="ml-1 text-foreground/80 hover:text-primary transition-colors">
            返回首页
          </Link>
        </p>
      </footer>
    </div>
  )
}
