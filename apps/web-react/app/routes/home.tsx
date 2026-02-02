import { Link } from 'react-router'
import { HomeFeatures } from '~/components/home/features'
import { HomeFooter } from '~/components/home/footer'
import { HomeHero } from '~/components/home/hero'
import { Button } from '~/components/ui/button'

export function meta() {
  return [
    { title: `推文存档站` },
    {
      name: 'description',
      content: `一个第三方 Twitter 查看器，专注于阅读体验和用户友好的界面设计。`,
    },
  ]
}

export const handle = {
  isHome: true,
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

      {/* Primary Action */}
      <div className="mb-16 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100 fill-mode-both">
        <Button
          render={<Link to="/tweets/240y_k" />}
          size="lg"
          className="rounded-full px-8 h-12 text-sm font-semibold transition-all hover:-translate-y-0.5"
        >
          查看示例存档
        </Button>
      </div>

      {/* Visual Separation / Section Header */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="h-px w-8 bg-border" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
          Core Features
        </span>
      </div>

      {/* Features Grid */}
      <HomeFeatures />

      {/* Footer & Build Info */}
      <HomeFooter />
    </main>
  )
}
