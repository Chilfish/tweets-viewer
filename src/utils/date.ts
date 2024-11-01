import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const tzs = {
  tokyo: 'Asia/Tokyo',
  beijing: 'Asia/Shanghai',
} as const

type Time = string | number | Date
type TZ = keyof typeof tzs

export function formatDate(
  time: Time,
  fmt = 'yyyy-MM-dd HH:mm:ss',
  tz: TZ = 'tokyo',
) {
  const date = getDate(time, tz)

  return format(
    date,
    fmt,
    { locale: zhCN },
  )
}

export function getDate(
  time: Time,
  tz: TZ = 'tokyo',
) {
  if (typeof time === 'number' && time < 1e12)
    time *= 1000

  let date = new Date(time)
  if (Number.isNaN(date.getTime()))
    date = new Date()

  return new TZDate(date.toUTCString(), tzs[tz])
}

export function now(tz: TZ = 'tokyo') {
  return TZDate.tz(tzs[tz])
}
