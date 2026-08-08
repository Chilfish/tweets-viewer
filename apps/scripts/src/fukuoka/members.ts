/**
 * 夢限大みゅーたいぷ 账号映射
 * 用于福冈公演等信息整理时的对照，以及跨账号搜索脚本复用。
 */

export interface Account {
  /** 内部标识 */
  key: string
  /** Twitter screen_name */
  userName: string
  /** 显示名（fullName） */
  name: string
  /** 担当 */
  role: string
  /** Twitter 用户 ID */
  id: string
}

/** 官方账号 */
export const OFFICIAL: Account = {
  key: 'official',
  userName: 'BDP_yumemita',
  name: '夢限大みゅーたいぷ',
  role: 'Official',
  id: '1546362523561390081',
}

/** 5 位成员 */
export const MEMBERS: Account[] = [
  {
    key: 'arale',
    userName: 'arale_yumemita',
    name: '仲町あられ',
    role: 'Vo.',
    id: '1712441105827119104',
  },
  {
    key: 'ritsu',
    userName: 'ritsu_yumemita',
    name: '峰月律',
    role: 'Gt.',
    id: '1712691036626288640',
  },
  {
    key: 'yuno',
    userName: 'yuno_yumemita',
    name: '千石ユノ',
    role: 'DJ & Mp.',
    id: '1712830996398096384',
  },
  {
    key: 'miyako',
    userName: 'miyako_yumemita',
    name: '藤都子',
    role: 'Key.',
    id: '1712839187546992640',
  },
  {
    key: 'nonoka',
    userName: 'nonoka_yumemita',
    name: '宮永ののか',
    role: 'Gt.',
    id: '1712673209555062784',
  },
]

/** 官方 + 全部成员 */
export const ALL_ACCOUNTS: Account[] = [OFFICIAL, ...MEMBERS]

/** 按 screen_name 快速查找 */
export function findByUserName(userName: string): Account | undefined {
  return ALL_ACCOUNTS.find(a => a.userName === userName)
}
