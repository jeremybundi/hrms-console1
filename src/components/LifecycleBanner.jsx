import { RiDeleteBinLine, RiPauseCircleLine } from 'react-icons/ri'
import { useI18n } from '../i18n/context'
import { formatDate, formatDateTime, timeAgo } from '../lib/format'

/** Why something is paused or deleted, and when a deletion becomes permanent. `kind` is 'organisation' or 'user'. */
export default function LifecycleBanner({ record, kind }) {
  const { t } = useI18n()
  const org = kind === 'organisation'

  if (record.status === 'deleted') {
    return (
      <Banner tone="bad" icon={RiDeleteBinLine}>
        <p className="font-semibold">
          {record.deleted_by
            ? t('Deleted {when} by {who}.', { when: timeAgo(record.deleted_at), who: record.deleted_by })
            : t('Deleted {when}.', { when: timeAgo(record.deleted_at) })}
        </p>
        {record.delete_reason && <p className="mt-0.5">{t('Reason: {reason}', { reason: record.delete_reason })}</p>}
        {record.purge_at && <p className="mt-0.5">{t(org ? 'It can be restored until {date}. After that it is removed for good.' : 'They can be restored until {date}. After that their details are erased for good.', { date: formatDate(record.purge_at) })}</p>}
      </Banner>
    )
  }
  if (record.status === 'paused') {
    return (
      <Banner tone="warn" icon={RiPauseCircleLine}>
        <p className="font-semibold">{record.paused_at ? t('Paused since {when}.', { when: formatDateTime(record.paused_at) }) : t('Paused.')}</p>
        <p className="mt-0.5">
          {record.pause_reason ? t('Reason: {reason}', { reason: record.pause_reason }) : t('No reason was given.')}{' '}
          {t(org ? 'Nobody there can sign in or keep working until it is resumed.' : 'They can’t sign in until resumed.')}
        </p>
      </Banner>
    )
  }
  return null
}

function Banner({ tone, icon: Icon, children }) {
  const colours = tone === 'bad' ? 'border-[var(--c-bad)]/30 bg-[var(--c-bad-soft)] text-[var(--c-bad)]' : 'border-[var(--c-warn)]/30 bg-[var(--c-warn-soft)] text-[var(--c-warn)]'
  return (
    <div className={`mb-4 flex gap-3 rounded-xl border px-4 py-3 text-sm ${colours}`}>
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
