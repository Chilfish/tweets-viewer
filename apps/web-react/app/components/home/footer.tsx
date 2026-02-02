import { formatDate } from '@tweets-viewer/shared'
import { Separator } from '~/components/ui/separator'

interface LinkProps {
  href: string
  children: React.ReactNode
}

function ExternalLink({ href, children }: LinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-primary transition-colors transition-underline underline-offset-4 hover:underline"
    >
      {children}
    </a>
  )
}

export function HomeFooter() {
  const otherProjects = [
    { name: '烤推机', url: 'https://anon-tweet.chilfish.top' },
    { name: '西尾文明暦', url: 'https://nishio.chilfish.top/zh' },
    { name: '西尾夕香 replive', url: 'https://replive-oyu.chilfish.top' },
    { name: '推し旅 AR 镜头', url: 'https://oshitabi.chilfish.top/' },
  ]

  return (
    <footer className="mt-20 w-full max-w-3xl space-y-8 pb-10 text-center animate-in fade-in duration-1000 delay-300 fill-mode-both">
      <Separator className="bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="space-y-4">
        <p className="text-sm font-medium">
          Made by
          {' '}
          <ExternalLink href="https://space.bilibili.com/259486090">@Chilfish</ExternalLink>
        </p>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
          <span className="text-muted-foreground/60 italic">其他作品：</span>
          {otherProjects.map(project => (
            <ExternalLink key={project.url} href={project.url}>
              {project.name}
            </ExternalLink>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 md:flex-row md:justify-center text-[10px] text-muted-foreground/50 uppercase tracking-widest">
        {__GIT_DATE__ && (
          <>
            <span>
              上次构建于：
              {formatDate(new Date(__GIT_DATE__))}
            </span>
            <span className="hidden md:inline">•</span>
          </>
        )}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/30 rounded-full border border-border/50">
          <span className="w-1.5 h-1.5 bg-green-500/50 rounded-full animate-pulse" />
          <span>{__GIT_HASH__}</span>
        </div>
      </div>
    </footer>
  )
}
