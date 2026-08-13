import { HomeFeatures } from '~/components/home/features'
import { HomeFooter } from '~/components/home/footer'
import { HomeHero } from '~/components/home/hero'
import { HomeMemoEntry } from '~/components/home/memo-entry'
import { HomeUserEntry } from '~/components/home/user-entry'

export function meta() {
  return [
    { title: `完整人生归档 · Tweets Viewer` },
    {
      name: 'description',
      content: `把一个人的完整网络人生归档，随时翻阅——推文、照片与每年今日的回忆，跨越时间线、媒体墙与搜索。`,
    },
  ]
}

export const handle = {
  isHome: true,
  pageTransition: 'fade',
}

export default function HomePage() {
  return (
    <main className="relative flex flex-col items-center justify-start min-h-screen px-6 pt-24 pb-12 overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-6xl h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      {/* Hero Section */}
      <HomeHero />

      {/* 那年今日仪式入口 */}
      <div className="mb-6 w-full flex flex-col items-center">
        <HomeMemoEntry />
      </div>

      {/* 归档用户入口：继续浏览 / 最近浏览 / 全部用户 */}
      <div className="mb-16 w-full flex flex-col items-center">
        <HomeUserEntry />
      </div>

      {/* Visual Separation / Section Header */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="h-px w-8 bg-border" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
          核心功能
        </span>
      </div>

      {/* Features Grid */}
      <HomeFeatures />

      {/* Footer & Build Info */}
      <HomeFooter />
    </main>
  )
}
