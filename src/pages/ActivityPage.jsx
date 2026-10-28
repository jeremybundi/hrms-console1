import { useState } from 'react'
import { RiSearchLine } from 'react-icons/ri'
import { listActivity } from '../api/platform'
import { useI18n } from '../i18n/context'
import { useResource } from '../lib/useResource'
import { useDebounced } from '../lib/useDebounced'
import ActivityFeed from '../components/ActivityFeed'
import { Card, Input, PageHeader, Pagination, Select, Spinner } from '../components/ui'

/** Everything platform admins (and the automatic clean-up) did, newest first. */
export default function ActivityPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  const { data, loading, error } = useResource(() => listActivity({ search: q, subject_type: type, page }), [q, type, page])

  return (
    <>
      <PageHeader title={t('Console activity')} subtitle={t('Every change made from this console: who did it, to what, when and why. Kept even after an organisation or sign-in is removed.')} />
      <Card padded={false}>
        <div className="flex flex-wrap gap-3 border-b border-[var(--c-border)] p-4">
          <div className="relative min-w-56 flex-1">
            <RiSearchLine size={16} className="pointer-events-none absolute left-3 top-3 text-[var(--c-muted)]" />
            <Input placeholder={t('Search by organisation, person, admin or reason')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
          </div>
          <div className="w-48">
            <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}>
              <option value="">{t('Everything')}</option>
              <option value="tenant">{t('Organisations')}</option>
              <option value="user">{t('Users')}</option>
              <option value="system">{t('System')}</option>
            </Select>
          </div>
        </div>
        {loading && !data ? <Spinner /> : error ? <p className="px-5 py-6 text-sm text-[var(--c-bad)]">{error}</p> : <ActivityFeed entries={data?.data ?? []} empty={t('Nothing matches.')} />}
        <Pagination meta={data?.meta} onPage={setPage} />
      </Card>
    </>
  )
}
