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
  options: {
    timezone?: TZ
    fmt?: string
  } = {},
) {
  const {
    timezone,
    fmt = 'yyyy-MM-dd HH:mm:ss',
  } = options

  return format(
    getDate(time, timezone),
    fmt,
    { locale: zhCN },
  )
}

export function getDate(
  time: Time,
  timezone?: TZ,
) {
  return new Date(
    new Date(time).toLocaleString(zhCN.code, {
      timeZone: timezone ? tzs[timezone] : undefined,
    }),
  )
}

export function now(
  timezone: TZ = 'beijing',
) {
  return getDate(new Date(), timezone)
}
