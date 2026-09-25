import type { TweetUser } from '@tweets-viewer/rettiwt-api'
import { cn } from '~/lib/utils'
import {
  Verified,
  VerifiedBusiness,
  VerifiedGovernment,
} from './icons/index'

interface Props {
  /** 只依赖认证三字段，故不限 `TweetUser` 本体（Space 主播等精简用户对象也可直接传入） */
  user: Pick<TweetUser, 'verified' | 'is_blue_verified' | 'verified_type'>
  className?: string
}

export function VerifiedBadge({ user, className }: Props) {
  const verified = user.verified || user.is_blue_verified || user.verified_type
  let icon = <Verified />
  let iconClassName: string | undefined = 'text-primary'

  if (verified) {
    if (!user.is_blue_verified) {
      iconClassName = 'text-muted-foreground'
    }
    switch (user.verified_type) {
      case 'Government':
        icon = <VerifiedGovernment />
        iconClassName = 'text-muted-foreground'
        break
      case 'Business':
        icon = <VerifiedBusiness />
        iconClassName = undefined
        break
    }
  }

  return verified
    ? (
        <div className={cn(className, iconClassName)}>{icon}</div>
      )
    : null
}
