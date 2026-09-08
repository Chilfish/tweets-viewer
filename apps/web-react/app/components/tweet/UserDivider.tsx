/** 全局视图（搜索/全量那年今日）里按作者分组的组头：头像 + 显示名 + @handle。 */
export function UserDivider({
  userName,
  displayName,
  avatarUrl,
}: {
  userName: string
  displayName?: string
  avatarUrl?: string
}) {
  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt=""
          className="size-5 rounded-full object-cover bg-muted"
          loading="lazy"
        />
      )}
      <span className="text-sm font-semibold tracking-wide text-foreground/80">
        {displayName || `@${userName}`}
      </span>
      {displayName && (
        <span className="text-xs text-muted-foreground">
          @
          {userName}
        </span>
      )}
      <div className="h-px flex-1 bg-border/60" />
    </div>
  )
}
