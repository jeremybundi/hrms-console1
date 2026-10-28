import { Fragment, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { RiArrowDownSLine, RiArrowRightSLine, RiLockLine, RiSearchLine } from 'react-icons/ri'
import { getAuditFilters, listAuditLogs, listTenants } from '../api/platform'
import { useI18n } from '../i18n/context'
import { useResource } from '../lib/useResource'
import { useDebounced } from '../lib/useDebounced'
import { formatDateTime, timeAgo } from '../lib/format'
import { Badge, Button, Card, Input, PageHeader, Pagination, Select, Spinner } from '../components/ui'

const CATEGORY_TONE = { sign_in: 'brand', change: 'muted', access: 'warn' }

/**
 * Every organisation's own audit trail: changes to records, sign-ins and access to
 * sensitive data. Sensitive values never leave the server; an entry only says it had some.
 */
export default function AuditPage() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [open, setOpen] = useState(null)
  const q = useDebounced(search)
  const filters = Object.fromEntries(['tenant_id', 'actor_id', 'category', 'action', 'from', 'to', 'page'].map((k) => [k, params.get(k) ?? '']))
  const { data, loading, error } = useResource(() => listAuditLogs({ ...filters, search: q }), [q, ...Object.values(filters)])
  const { data: tenants } = useResource(() => listTenants({ per_page: 100, sort: 'name' }).then((r) => r.data), [])
  const { data: options } = useResource(getAuditFilters, [])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }
  const anyFilter = Object.entries(filters).some(([k, v]) => k !== 'page' && v) || q

  return (
    <>
      <PageHeader title={t('Audit logs')} subtitle={t('Every organisation’s audit trail in one place: changes to records, sign-ins, and who opened sensitive data. Salaries and bank details stay hidden.')} />
      <Card padded={false}>
        <div className="grid grid-cols-1 gap-3 border-b border-[var(--c-border)] p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative sm:col-span-2">
            <RiSearchLine size={16} className="pointer-events-none absolute left-3 top-3 text-[var(--c-muted)]" />
            <Input placeholder={t('Search record, person, type or IP')} value={search} onChange={(e) => { setSearch(e.target.value); setParam('page', '') }} className="pl-9" />
          </div>
          <Select value={filters.tenant_id} onChange={(e) => setParam('tenant_id', e.target.value)}>
            <option value="">{t('All organisations')}</option>
            {(tenants ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
          <Select value={filters.category} onChange={(e) => setParam('category', e.target.value)}>
            <option value="">{t('All kinds')}</option>
            {(options?.categories ?? []).map((c) => <option key={c} value={c}>{t(c)}</option>)}
          </Select>
          <Input type="date" aria-label={t('From')} value={filters.from} onChange={(e) => setParam('from', e.target.value)} />
          <Input type="date" aria-label={t('To')} value={filters.to} onChange={(e) => setParam('to', e.target.value)} />
        </div>
        {(filters.actor_id || filters.action || anyFilter) && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--c-border)] px-4 py-2 text-xs text-[var(--c-muted)]">
            {filters.actor_id && <Badge tone="brand">{t('Done by user #{id}', { id: filters.actor_id })}</Badge>}
            {filters.action && <Badge tone="brand">{filters.action}</Badge>}
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setParams({}, { replace: true }) }}>{t('Clear filters')}</Button>
          </div>
        )}

        {loading && !data ? <Spinner /> : error ? <p className="px-5 py-6 text-sm text-[var(--c-bad)]">{error}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--c-border)] text-[11px] uppercase tracking-wider text-[var(--c-muted)]">
                  <th className="w-8 px-3 py-3" />
                  <th className="px-3 py-3 font-semibold">{t('When')}</th>
                  <th className="px-3 py-3 font-semibold">{t('Organisation')}</th>
                  <th className="px-3 py-3 font-semibold">{t('Who')}</th>
                  <th className="px-3 py-3 font-semibold">{t('What')}</th>
                  <th className="px-3 py-3 font-semibold">{t('Record')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((log) => (
                  <Fragment key={log.id}>
                    <tr onClick={() => setOpen(open === log.id ? null : log.id)} className="cursor-pointer border-b border-[var(--c-border)] hover:bg-[var(--c-input)]/60">
                      <td className="px-3 py-3 text-[var(--c-muted)]">{open === log.id ? <RiArrowDownSLine size={16} /> : <RiArrowRightSLine size={16} />}</td>
                      <td className="whitespace-nowrap px-3 py-3" title={formatDateTime(log.created_at)}>{timeAgo(log.created_at)}</td>
                      <td className="px-3 py-3">{log.tenant ? <Link to={`/organisations/${log.tenant.id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">{log.tenant.name}</Link> : '—'}</td>
                      <td className="px-3 py-3">{log.actor_name ?? <span className="text-[var(--c-muted)]">{t(log.actor_type === 'system' ? 'System' : 'Unknown')}</span>}</td>
                      <td className="px-3 py-3">
                        <span className="flex flex-wrap items-center gap-1.5">
                          <Badge tone={CATEGORY_TONE[log.category] ?? 'muted'}>{t(log.category)}</Badge>
                          <span className="font-mono text-xs">{log.action}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="max-w-xs truncate font-medium">{log.record_label ?? '—'}</p>
                        <p className="text-xs text-[var(--c-muted)]">{log.entity}{log.entity_id ? ` #${log.entity_id}` : ''}</p>
                      </td>
                    </tr>
                    {open === log.id && (
                      <tr className="border-b border-[var(--c-border)] bg-[var(--c-input)]/40">
                        <td />
                        <td colSpan={5} className="px-3 py-4"><Changes log={log} t={t} /></td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {(data?.data ?? []).length === 0 && <p className="px-5 py-10 text-center text-sm text-[var(--c-muted)]">{anyFilter ? t('Nothing matches.') : t('No audit entries yet.')}</p>}
          </div>
        )}
        <Pagination meta={data?.meta} onPage={(p) => setParam('page', String(p))} />
      </Card>
    </>
  )
}

/** Before and after for each field that changed, and where the request came from. */
function Changes({ log, t }) {
  const keys = [...new Set([...Object.keys(log.old_values ?? {}), ...Object.keys(log.new_values ?? {})])]
  const show = (v) => (v === null || v === undefined || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))

  return (
    <div className="space-y-3">
      {keys.length > 0 ? (
        <table className="w-full text-xs">
          <thead><tr className="text-left text-[var(--c-muted)]"><th className="pb-1 pr-4 font-semibold">{t('Field')}</th><th className="pb-1 pr-4 font-semibold">{t('Before')}</th><th className="pb-1 font-semibold">{t('After')}</th></tr></thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k} className="align-top">
                <td className="py-1 pr-4 font-mono">{k}</td>
                <td className="max-w-xs break-words py-1 pr-4 text-[var(--c-bad)]">{show(log.old_values?.[k])}</td>
                <td className="max-w-xs break-words py-1 text-[var(--c-ok)]">{show(log.new_values?.[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className="text-xs text-[var(--c-muted)]">{t('No field changes recorded for this entry.')}</p>}
      {log.has_sensitive && <p className="flex items-center gap-1.5 text-xs text-[var(--c-warn)]"><RiLockLine size={14} />{t('Sensitive fields also changed. Their values stay encrypted and aren’t shown here.')}</p>}
      <p className="text-xs text-[var(--c-muted)]">{formatDateTime(log.created_at)}{log.ip_address && ` · IP ${log.ip_address}`}{log.user_agent && <span className="block truncate" title={log.user_agent}>{log.user_agent}</span>}</p>
    </div>
  )
}
