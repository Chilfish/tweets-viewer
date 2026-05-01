import type { EnrichedTweet } from '@tweets-viewer/rettiwt-api'

export function TweetMediaAlt({ tweet }: { tweet: EnrichedTweet }) {
  const { entities } = tweet
  const altEntitiesSize = entities?.filter(e => e.type === 'media_alt')?.length || 0

  if (!tweet.media_details?.length)
    return null

  if (!altEntitiesSize) {
    return null
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border/20 bg-muted/30">
      <div className="flex items-center justify-between border-b border-border/10 bg-muted/40 px-3 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">
          图片描述
        </span>
      </div>
      <div className="space-y-4 py-3 px-2">
        {tweet.media_details.map((media, i) => {
          if (media.type !== 'photo' || !media.ext_alt_text)
            return null
          return (
            <div
              key={media.media_url_https || i}
              className="flex flex-col py-2.5 px-2 border border-border/50 rounded bg-muted/70"
            >
              <div className="tweet-body text-[13px] leading-relaxed wrap-break-words">
                <span
                  className="mr-1.5 inline-flex min-w-fit h-4 items-center justify-center rounded bg-card/30 border border-border/50 px-1.5 text-[10px] font-bold text-muted-foreground align-middle"
                >
                  图
                  {i + 1}
                </span>
                {media.ext_alt_text}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
