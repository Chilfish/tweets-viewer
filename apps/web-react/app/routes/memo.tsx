import { ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { TweetCard } from '~/components/tweets/tweet-card'
import { Button } from '~/components/ui/button'
import { useAppStore } from '~/stores/app-store'
import { useTweetsStore } from '~/stores/tweets-store'
import { useUserStore } from '~/stores/user-store'
import type { Tweet, User } from '~/types'
import type { Route } from './+types/memo'

export function meta({ params }: Route.MetaArgs) {
  const { name } = params
  return [
    { title: `@${name}'s Memories` },
    { name: 'description', content: `Historical tweets from @${name}` },
  ]
}

export default function MemoPage({ params }: Route.ComponentProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [memoryTweets, setMemoryTweets] = useState<Tweet[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  const { getUser, users, setCurUser } = useUserStore()
  const { tweets } = useTweetsStore()

  const user: User | null = users[params.name] || null

  useEffect(() => {
    // 获取用户数据
    getUser(params.name).then(() => {
      setCurUser(params.name)
    })
  }, [params.name])

  useEffect(() => {
    loadMemoryTweets()
  }, [selectedDate, currentYear, tweets])

  const loadMemoryTweets = async () => {
    setIsLoading(true)

    // 模拟加载延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    // 筛选出与当前日期匹配的历史推文
    const today = selectedDate
    const todayMonth = today.getMonth()
    const todayDate = today.getDate()

    const filteredTweets = tweets.filter((tweet) => {
      const tweetDate = new Date(tweet.createdAt)
      const tweetYear = tweetDate.getFullYear()
      const tweetMonth = tweetDate.getMonth()
      const tweetDay = tweetDate.getDate()

      // 匹配月份和日期，但年份要小于当前选中的年份
      return (
        tweetMonth === todayMonth &&
        tweetDay === todayDate &&
        tweetYear < currentYear
      )
    })

    // 按年份倒序排列
    filteredTweets.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    setMemoryTweets(filteredTweets)
    setIsLoading(false)
  }

  const navigateYear = (direction: 'prev' | 'next') => {
    const newYear = direction === 'prev' ? currentYear - 1 : currentYear + 1
    const maxYear = new Date().getFullYear()
    const minYear = 2006 // Twitter创建年份

    if (newYear >= minYear && newYear <= maxYear) {
      setCurrentYear(newYear)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
    })
  }

  const getYearsAgo = (tweetDate: Date) => {
    const years = currentYear - tweetDate.getFullYear()
    return years
  }

  if (!user) {
    return (
      <div className='flex min-h-svh items-center justify-center'>
        <div className='text-muted-foreground'>Loading user...</div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background text-foreground transition-colors duration-200'>
      <div className='max-w-2xl mx-auto'>
        {/* Header */}
        <div className='sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-200'>
          <div className='p-4'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h1 className='text-2xl font-bold'>那年今日</h1>
                <p className='text-sm text-muted-foreground'>
                  @{user.screenName} 的历史推文
                </p>
              </div>
              <Calendar className='h-6 w-6 text-blue-500' />
            </div>

            {/* Date and Year Navigation */}
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm text-foreground'>
                  {formatDate(selectedDate)}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => navigateYear('prev')}
                  disabled={currentYear <= 2006}
                  className='border-border text-foreground hover:bg-accent transition-colors duration-200'
                >
                  <ArrowLeft className='h-3 w-3' />
                </Button>

                <span className='text-sm font-medium px-3 text-foreground'>
                  {currentYear}
                </span>

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => navigateYear('next')}
                  disabled={currentYear >= new Date().getFullYear()}
                  className='border-border text-foreground hover:bg-accent transition-colors duration-200'
                >
                  <ArrowRight className='h-3 w-3' />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='p-4'>
          {isLoading ? (
            <div className='text-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4'></div>
              <p className='text-muted-foreground'>Loading memories...</p>
            </div>
          ) : memoryTweets.length === 0 ? (
            <div className='text-center py-12'>
              <Calendar className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
              <h2 className='text-xl font-semibold mb-2 text-muted-foreground'>
                No memories found
              </h2>
              <p className='text-muted-foreground'>
                No tweets found for {formatDate(selectedDate)} in {currentYear}
              </p>
            </div>
          ) : (
            <div className='space-y-6'>
              <div className='text-sm text-muted-foreground'>
                Found {memoryTweets.length} memory
                {memoryTweets.length !== 1 ? 's' : ''} for{' '}
                {formatDate(selectedDate)}
              </div>

              {memoryTweets.map((tweet) => (
                <div key={tweet.id} className='relative'>
                  <div className='absolute -left-2 top-4 w-2 h-2 rounded-full bg-primary'></div>
                  <div className='ml-4 pl-4 border-l-2 border-border'>
                    <div className='text-xs mb-2 text-muted-foreground'>
                      {getYearsAgo(new Date(tweet.createdAt))} years ago •{' '}
                      {new Date(tweet.createdAt).getFullYear()}
                    </div>
                    <TweetCard tweet={tweet} user={user} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
