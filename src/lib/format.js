const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const numberFmt = new Intl.NumberFormat()

export const formatDate = (v) => (v ? dateFmt.format(new Date(v)) : '—')
export const formatDateTime = (v) => (v ? dateTimeFmt.format(new Date(v)) : '—')
export const formatNumber = (v) => (v === null || v === undefined ? '—' : numberFmt.format(v))

/** "5 minutes ago", "in 2 hours". */
export function timeAgo(v) {
  if (!v) return 'never'
  const seconds = Math.round((new Date(v).getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const steps = [[60, 'second'], [60, 'minute'], [24, 'hour'], [30, 'day'], [12, 'month'], [Infinity, 'year']]
  let value = seconds
  for (const [size, unit] of steps) {
    if (Math.abs(value) < size) return rtf.format(Math.round(value), unit)
    value /= size
  }
  return formatDate(v)
}

/** TENANT_ADMIN → Tenant admin. */
export const roleLabel = (code) => (code ? code.charAt(0) + code.slice(1).toLowerCase().replaceAll('_', ' ') : '—')
