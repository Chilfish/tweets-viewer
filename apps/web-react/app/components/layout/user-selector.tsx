import { Check, ChevronDown, User } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

import { useUserStore } from '~/store/use-user-store'

export function UserSelector() {
  const location = useLocation()
  const curPath = location.pathname.split('/')[1] || 'tweets'

  const userList = useUserStore(state => state.users)
  const activeUser = useUserStore(state => state.activeUser)
  const hasHydrated = useUserStore(state => state._hasHydrated)

  // Prevent flicker during hydration if persisted
  if (!hasHydrated)
    return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={(
        <Button
          variant="ghost"
        />
      )}
      >
        {activeUser ? (
          <>
            <Avatar className="size-8">
              <AvatarImage src={activeUser.profileImage} />
              <AvatarFallback>{activeUser.fullName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start overflow-hidden">
              <span className="font-semibold text-sm truncate">
                {activeUser.fullName}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                @
                {activeUser.userName}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="size-8 rounded-full bg-muted flex items-center justify-center">
              <User className="size-4 text-muted-foreground" />
            </div>
            <span className="font-medium text-sm">选择用户</span>
          </>
        )}
        <ChevronDown className="size-4 ml-auto text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        {userList.length > 0 ? (
          <>
            {userList.map(user => (
              <DropdownMenuItem
                key={user.fullName}
                className="flex items-center gap-3 p-2 cursor-pointer"
                render={<NavLink to={`/${curPath}/${user.userName}`} />}
              >
                <Avatar className="size-8">
                  <AvatarImage src={user.profileImage} />
                  <AvatarFallback>{user.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="font-medium text-sm truncate">
                    {user.fullName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    @
                    {user.userName}
                  </span>
                </div>
                {activeUser?.userName === user.userName && (
                  <Check className="size-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : (
          <div className="p-2 text-sm text-muted-foreground text-center">
            无归档用户
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
