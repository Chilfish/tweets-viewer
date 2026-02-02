import type { ElementType } from 'react'
import { Calendar, Search, Sparkles, Users } from 'lucide-react'

interface FeatureProps {
  icon: ElementType
  title: string
  description: string
}

function FeatureItem({ icon: Icon, title, description }: FeatureProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card/50 p-6 transition-all hover:bg-card hover:shadow-lg">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-2 font-bold text-base">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}

export function HomeFeatures() {
  const features = [
    {
      icon: Users,
      title: '多账号快速切换',
      description: '无缝管理多个推主的归档数据，支持在不同用户间即时跳转。',
    },
    {
      icon: Sparkles,
      title: '沉浸式阅读界面',
      description: '采用流式布局与无限滚动，专为长文阅读和图片展示优化。',
    },
    {
      icon: Search,
      title: '高效全文索引',
      description: '支持按关键字、日期范围精准筛选，在海量存档中快速定位。',
    },
    {
      icon: Calendar,
      title: '历史上的今天',
      description: '自动索引往年同期的历史推文，帮助你快速回顾社交动态。',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
      {features.map(feature => (
        <FeatureItem key={feature.title} {...feature} />
      ))}
    </div>
  )
}
