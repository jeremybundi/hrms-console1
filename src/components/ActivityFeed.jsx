import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/context'
import { actionLabel, actionTone, detailLine } from '../lib/activity'
import { formatDateTime, timeAgo } from '../lib/format'
import { Badge } from './ui'

const DOT = { ok: 'bg-[var(--c-ok)]', warn: 'bg-[var(--c-warn)]', bad: 'bg-[var(--c-bad)]', muted: 'bg-[var(--c-muted)]' }

/** Entries from the activity log, newest first. `showSubject` links each entry to what it was about. */
export default function ActivityFeed({ entries, showSubject = true, empty }) {
  const { t } = useI18n()
  if (!entries.length) return <p className="px-5 py-8 text-center text-sm text-[var(--c-muted)]">{empty ?? t('Nothing has been done here yet.')}</p>

  return (
    <ol className="divide-y divide-[var(--c-border)]">
      {entries.map((e) => {
        const detail = detailLine(e, t)
        const link = e.subject_type === 'tenant' ? `/organisations/${e.subject_id}` : e.subject_type === 'user' ? `/users/${e.subject_id}` : null
        return (
          <li key={e.id} className="flex gap-3 px-5 py-3">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[actionTone(e.action)]}`} />
            <div className="min-w-0 flex-1 text-sm">
              <p>
                <b className="font-semibold">{e.actor_name === 'HRMS (automatic)' ? t('HRMS (automatic)') : e.actor_name}</b> {t(actionLabel(e.action))}
                {showSubject && <> {link && !/purged|erased/.test(e.action) ? <Link to={link} className="font-medium text-[var(--c-brand)] hover:underline">{e.subject_label}</Link> : <span className="font-medium">{e.subject_label}</span>}</>}
              </p>
              {e.reason && <p className="mt-0.5 text-[var(--c-muted)]">“{e.reason}”</p>}
              {detail && <p className="mt-0.5 text-xs text-[var(--c-muted)]">{detail}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-[var(--c-muted)]" title={formatDateTime(e.created_at)}>{timeAgo(e.created_at)}</p>
              {e.subject_type === 'system' && <Badge>{t('System')}</Badge>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
