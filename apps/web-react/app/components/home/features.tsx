import type { ElementType } from 'react'
import { Calendar, Infinity, Search, Users } from 'lucide-react'

interface FeatureProps {
  icon: ElementType
  title: string
  description: string
}

function FeatureItem({ icon: Icon, title, description }: FeatureProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card/50 p-6 transition-all duration-300 hover:bg-card hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
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
      title: '多个归档用户',
      description: '在侧边栏换一个人，时间线、媒体和搜索都会跟着换。',
    },
    {
      icon: Infinity,
      title: '连续阅读',
      description: '滚到底自动加载下一页；也可以用分页器跳到某一页。',
    },
    {
      icon: Search,
      title: '搜索和筛选',
      description: '按关键词搜全部推文，也可以限定日期范围或某个用户。',
    },
    {
      icon: Calendar,
      title: '那年今日',
      description: '看看往年今天发过什么，按年份排好。',
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
