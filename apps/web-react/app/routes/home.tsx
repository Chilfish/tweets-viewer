import type { JSX } from 'react'
import { formatDate } from '@tweets-viewer/shared'
import { Link } from 'react-router'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { cn } from '~/lib/utils'

export function meta() {
  return [
    { title: `推文存档站` },
    {
      name: 'description',
      content: `一个第三方 Twitter 查看器，专注于阅读体验和用户友好的界面设计。`,
    },
  ]
}

interface LinkProps {
  to: string
  className?: string
  children?: JSX.Element | string
}

function Linker({ to, className, children }: LinkProps) {
  return (
    <a
      href={to}
      className={cn(
        'inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline mx-1',
        className,
      )}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">推文存档站</CardTitle>
          <CardDescription>
            一个第三方 Twitter 存档站，专注于阅读体验和用户友好的界面设计。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold">✨ 主要功能</h3>
            <ul className="mt-2 ml-4 space-y-2 list-disc text-muted-foreground">
              <li>多用户快速切换</li>
              <li>推文无限滚动加载</li>
              <li>按日期和关键字搜索推文</li>
              <li>“那年今日”回顾历史推文</li>
            </ul>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button
              render={<Link to="/tweets/240y_k" />}
              size="lg"
            >
              开始查看
            </Button>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="flex flex-col items-center justify-center text-sm">
          <p>
            Made by
            <Linker to="https://space.bilibili.com/259486090">@Chilfish</Linker>
          </p>
          <div className="text-center">
            <span>其他作品：</span>
            <span className="inline-flex gap-1">
              <Linker to="https://anon-tweet.chilfish.top">烤推机</Linker>
              /
              <Linker to="https://nishio.chilfish.top/zh">西尾文明暦</Linker>
              /
              <Linker to="https://replive.chilfish.top">
                西尾夕香 replive
              </Linker>
              /
              <Linker to="https://oshitabi.chilfish.top/">
                推し旅 AR 镜头
              </Linker>
            </span>
          </div>

          <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
            <span>
              上次构建于：
              {formatDate(new Date(__GIT_DATE__))}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-md border">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>{__GIT_HASH__}</span>
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
