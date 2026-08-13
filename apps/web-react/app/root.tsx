import type { Route } from './+types/root'
import { AlertTriangle } from 'lucide-react'
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import { GlobalMediaViewer } from './components/media/GlobalMediaViewer'
import { ProgressBar } from './components/progress-bar'
import { Button } from './components/ui/button'
import { useTheme } from './hooks/use-theme'
import './app.css'
import './fonts.css'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@100..900&family=Noto+Sans+Math&family=Noto+Sans+Symbols&family=Noto+Sans+Symbols+2&display=swap',
  },
  // PWA（4C-4）：manifest + iOS 主屏幕图标
  { rel: 'manifest', href: '/manifest.webmanifest' },
  { rel: 'apple-touch-icon', href: '/icon.jpg' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh"
      className="touch-manipulation overflow-x-hidden"
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/jpeg" href="/icon.jpg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f5f9fb" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="推文存档" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storage = localStorage.getItem('tweets-viewer-app-storage');
                  if (storage) {
                    const theme = JSON.parse(storage).state.theme;
                    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* <script
          src="//unpkg.com/react-scan/dist/auto.global.js"
        /> */}
      </head>
      <body>
        <ProgressBar />
        {children}
        <GlobalMediaViewer />
        <ScrollRestoration getKey={location => location.pathname} />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  useTheme()
  return <Outlet />
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = '出错了'
  let details = '发生意外错误，请稍后重试。'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '页面不存在' : '发生错误'
    details
      = error.status === 404
        ? '你访问的页面不存在。'
        : error.data?.message || error.statusText
  }
  else if (import.meta.env.DEV && error && error instanceof Error) {
    message = error.message
    details = '出错了。'
    stack = error.stack
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-2">
          {message}
        </h1>
        <p className="text-muted-foreground mb-6">{details}</p>
        {stack && (
          <pre className="w-full p-4 overflow-x-auto bg-muted text-muted-foreground rounded text-left text-sm">
            <code>{stack}</code>
          </pre>
        )}
        <Button render={<a href="/" />}>
          返回首页
        </Button>
      </div>
    </div>
  )
}
