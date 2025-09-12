import type { User } from '@tweets-viewer/shared'
import { request } from '@tweets-viewer/shared'

// 获取用户列表
export async function getUsers(): Promise<User[]> {
  const res = await request.get<User[]>('/users/get', {
    id: 'users-list',
  })
  return res.data
}
