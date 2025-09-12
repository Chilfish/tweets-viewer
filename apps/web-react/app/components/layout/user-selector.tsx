import { Check, ChevronDown, Plus, User } from 'lucide-react'
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
import { cn } from '~/lib/utils'
import { useUserStore } from '~/stores/user-store'

export function UserSelector() {
  const location = useLocation()
  const curPath = location.pathname.split('/')[1]
  const { users, curUser } = useUserStore()

  const userList = Object.values(users)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className={cn(
            'flex items-center gap-3 h-auto py-2 px-3 justify-start',
          )}
        >
          {curUser ? (
            <>
              <Avatar className='size-8'>
                <AvatarImage src={curUser.avatarUrl} />
                <AvatarFallback>{curUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className='flex flex-col items-start'>
                <span className='font-medium text-sm'>@{curUser.name}</span>
              </div>
            </>
          ) : (
            <>
              <div className='size-8 rounded-full bg-gray-200 flex items-center justify-center'>
                <User className='size-4 text-gray-500' />
              </div>
              <span className='font-medium text-sm'>选择用户</span>
            </>
          )}
          <ChevronDown className='size-4 ml-auto' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='start' className='w-fit px-4'>
        {userList.length > 0 && (
          <>
            {userList.map((user) => (
              <DropdownMenuItem
                key={user.screenName}
                className='flex items-center gap-3 p-2'
                asChild
              >
                <NavLink to={`/${curPath}/${user.screenName}`}>
                  <Avatar className='size-6'>
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className='flex flex-col flex-1'>
                    <span className='font-medium text-sm'>@{user.name}</span>
                  </div>
                  {curUser?.screenName === user.screenName && (
                    <Check className='size-4 text-blue-600' />
                  )}
                </NavLink>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
