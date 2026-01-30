import { Badge } from '~/components/ui/badge'

export function HomeHero() {
  return (
    <div className="flex flex-col items-center text-center space-y-4 mb-10">
      <Badge variant="secondary" className="px-3 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border-transparent">
        Twitter 存档阅读工具
      </Badge>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
        Tweets Viewer
      </h1>
      <p className="max-w-[540px] text-base md:text-lg text-muted-foreground leading-snug">
        专注于阅读效率的第三方推文存档查看器。
        提供沉浸式布局、全文搜索和多账号快速切换，让历史推文的查阅更简单。
      </p>
    </div>
  )
}
