let locale

/** Dates and numbers follow the console's language. */
export function setFormatLocale(next) {
  locale = next
}

export const formatDate = (v) => (v ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(v)) : '—')
export const formatDateTime = (v) => (v ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(v)) : '—')
export const formatNumber = (v) => (v === null || v === undefined ? '—' : new Intl.NumberFormat(locale).format(v))
export const monthLabel = (ym) => new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(`${ym}-01T00:00:00`))
export const dayLabel = (date) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${date}T00:00:00`))

/** "5 minutes ago", "in 2 hours", in the console's language. */
export function timeAgo(v) {
  if (!v) return '—'
  const seconds = Math.round((new Date(v).getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
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
