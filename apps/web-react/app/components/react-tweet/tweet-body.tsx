import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'
import { cn } from '~/lib/utils'
import { TweetLink } from './tweet-link'

interface TweetBodyProps {
  tweet: EnrichedTweet
  lang?: string
  className?: string
}

export function TweetBody({ tweet, lang, className }: TweetBodyProps) {
  return (
    <p
      className={cn('tweet-body', className)}
      lang={lang ?? tweet.lang}
      dir="auto"
    >
      {tweet.entities.map((item, i) => {
        const text = item.text

        switch (item.type) {
          case 'url':
            return (
              <TweetLink key={i} href={item.href}>
                {text.length > 36 ? item.display_url : text}
              </TweetLink>
            )

          case 'hashtag':
          case 'mention':
          case 'symbol':
            return (
              <TweetLink key={i} href={item.href}>
                {text}
              </TweetLink>
            )
          case 'media':
          // Media text is currently never displayed, some tweets however might have indices
          // that do match `display_text_range` so for those cases we ignore the content.
            return null
          case 'media_alt':
            return null
          case 'separator':
            return null
          default:
          // We use `dangerouslySetInnerHTML` to preserve the text encoding.
          // https://github.com/vercel-labs/react-tweet/issues/29
            return (
              <span key={i} dangerouslySetInnerHTML={{ __html: text }} />
            )
        }
      })}
    </p>
  )
}
