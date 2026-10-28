import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiBuilding2Line, RiSearchLine, RiUserLine } from 'react-icons/ri'
import { listTenants, listUsers } from '../api/platform'
import { useI18n } from '../i18n/context'
import { useDebounced } from '../lib/useDebounced'
import { useResource } from '../lib/useResource'
import StatusBadge from './StatusBadge'
import { Spinner } from './ui'

/** Finds organisations and users anywhere on the platform. Mounted while open, so each opening starts empty. */
export default function SearchPalette({ onClose }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const q = useDebounced(query.trim(), 250)
  const { data, loading, error } = useResource(() => (q.length < 2 ? Promise.resolve([]) : Promise.all([listTenants({ search: q, per_page: 5 }), listUsers({ search: q, per_page: 8 })])
    .then(([orgs, users]) => [
      ...orgs.data.map((o) => ({ key: `o${o.id}`, to: `/organisations/${o.id}`, icon: RiBuilding2Line, title: o.name, sub: o.domain || o.slug, status: o.status })),
      ...users.data.map((u) => ({ key: `u${u.id}`, to: `/users/${u.id}`, icon: RiUserLine, title: u.name, sub: [u.email, u.tenant?.name].filter(Boolean).join(' · '), status: u.status })),
    ])), [q])
  const items = data ?? []
  const results = { items, loading, error }

  const go = (item) => { onClose(); navigate(item.to) }
  const onKey = (e) => {
    if (e.key === 'Escape') onClose()
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results.items[active]) go(results.items[active])
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onMouseDown={onClose}>
      <div role="dialog" aria-label={t('Search')} className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-[var(--c-border)] px-4">
          <RiSearchLine size={18} className="text-[var(--c-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0) }}
            onKeyDown={onKey}
            placeholder={t('Search organisations and users')}
            className="h-14 flex-1 bg-transparent text-sm text-[var(--c-text)] outline-none"
          />
          <kbd className="rounded border border-[var(--c-border)] px-1.5 py-0.5 text-[10px] text-[var(--c-muted)]">Esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {q.length < 2 ? <p className="px-3 py-6 text-center text-sm text-[var(--c-muted)]">{t('Type at least two letters of a name, email or domain.')}</p>
            : results.loading && results.items.length === 0 ? <Spinner />
              : results.error ? <p className="px-3 py-6 text-center text-sm text-[var(--c-bad)]">{results.error}</p>
                : results.items.length === 0 ? <p className="px-3 py-6 text-center text-sm text-[var(--c-muted)]">{t('Nothing matches “{q}”.', { q })}</p>
                  : results.items.map((item, i) => (
                    <button
                      key={item.key}
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${i === active ? 'bg-[var(--c-input)]' : ''}`}
                    >
                      <item.icon size={18} className="shrink-0 text-[var(--c-muted)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.title}</span>
                        <span className="block truncate text-xs text-[var(--c-muted)]">{item.sub}</span>
                      </span>
                      <StatusBadge status={item.status} />
                    </button>
                  ))}
        </div>
      </div>
    </div>
  )
}
