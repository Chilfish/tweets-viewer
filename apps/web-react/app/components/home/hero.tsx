import { Badge } from '~/components/ui/badge'

export function HomeHero() {
  return (
    <div className="flex flex-col items-center text-center space-y-4 mb-10">
      {/* 5E-4：hero 入场动效（阶梯式上浮淡入，与 ViewTransition 进入动画协调） */}
      <Badge
        variant="secondary"
        className="px-3 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border-transparent animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
      >
        完整人生归档
      </Badge>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground animate-in fade-in slide-in-from-bottom-3 duration-500 delay-75 fill-mode-both">
        Tweets Viewer
      </h1>
      <p className="max-w-[540px] text-base md:text-lg text-muted-foreground leading-snug animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150 fill-mode-both">
        把一个人的完整网络人生，收进一本永不结束的日记。
        推文、照片与每年今日的回忆，随时翻阅。
      </p>
    </div>
  )
}
