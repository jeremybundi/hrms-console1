import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RiAddLine, RiBuilding2Line, RiDownloadLine, RiKey2Line, RiLockLine, RiPauseCircleLine, RiPlayCircleLine, RiSearchLine } from 'react-icons/ri'
import { addMember, getTenant, listTenants, listUsers, pauseUser, resumeUser, sendPasswordLink } from '../api/platform'
import { useI18n } from '../i18n/context'
import { useResource } from '../lib/useResource'
import { useDebounced } from '../lib/useDebounced'
import { formatDate, roleLabel, timeAgo } from '../lib/format'
import { downloadCsv, fetchAll, toCsv } from '../lib/csv'
import { useToast } from '../components/toast'
import ActionModal from '../components/ActionModal'
import StatusBadge from '../components/StatusBadge'
import { Badge, Button, Card, Input, Modal, PageHeader, Pagination, Select, Spinner, Table } from '../components/ui'

export default function UsersPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') ?? '')
  const tenantId = params.get('tenant_id') ?? ''
  const status = params.get('status') ?? ''
  const page = Number(params.get('page') ?? 1)
  const q = useDebounced(search)
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  // Picked users by id, kept across pages so a bulk action can span them.
  const [picked, setPicked] = useState(() => new Map())
  const [bulk, setBulk] = useState(null)
  const [exporting, setExporting] = useState(false)
  // Nothing is listed until an organisation is chosen.
  const { data, loading, error, reload } = useResource(() => (tenantId ? listUsers({ search: q, tenant_id: tenantId, status, page }) : Promise.resolve(null)), [q, tenantId, status, page])
  const { data: tenants } = useResource(() => listTenants({ per_page: 100, sort: 'name' }).then((r) => r.data), [])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    if (key === 'tenant_id') setPicked(new Map())
    setParams(next, { replace: true })
  }

  const rows = data?.data ?? []
  const onSelect = (ids) => setPicked((prev) => {
    const seen = new Map([...prev, ...rows.map((u) => [u.id, u])])
    return new Map([...ids].map((id) => [id, seen.get(id)]))
  })
  const pickedUsers = [...picked.values()]
  const eligible = {
    pause: pickedUsers.filter((u) => u.status === 'active'),
    resume: pickedUsers.filter((u) => u.status === 'paused'),
    link: pickedUsers.filter((u) => u.status === 'active' || u.status === 'paused'),
  }

  /** Runs one call per user, one at a time, then says how it went. */
  async function runBulk(users, call, doneMessage) {
    const failed = []
    for (const u of users) {
      try { await call(u) } catch (err) { failed.push(`${u.email}: ${err.message}`) }
    }
    const ok = users.length - failed.length
    if (ok) toast.success(t(doneMessage, { count: ok }))
    if (failed.length) toast.error(t('{count} failed. {first}', { count: failed.length, first: failed[0] }))
    setPicked(new Map())
    setBulk(null)
    reload({ quiet: true })
  }

  async function exportCsv() {
    setExporting(true)
    try {
      const all = await fetchAll(listUsers, { search: q, tenant_id: tenantId, status })
      const org = (tenants ?? []).find((r) => String(r.id) === tenantId)?.name ?? 'organisation'
      downloadCsv(`users-${org.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([
        { header: 'Name', value: (u) => u.name },
        { header: 'Email', value: (u) => u.email },
        { header: 'Role', value: (u) => roleLabel(u.role) },
        { header: 'Status', value: (u) => u.status },
        { header: 'Email verified', value: (u) => (u.email_verified ? 'yes' : 'no') },
        { header: 'Locked out', value: (u) => (u.locked ? 'yes' : 'no') },
        { header: 'Platform admin', value: (u) => (u.is_platform_admin ? 'yes' : 'no') },
        { header: 'Signed in to', value: (u) => u.tenant?.name },
        { header: 'Created', value: (u) => u.created_at },
      ], all))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <PageHeader
        title={t('Users')}
        subtitle={t('Every sign-in on the platform. Open one to reset a password, unlock, pause or delete it, or change what they can do.')}
        actions={tenantId && <>
          <Button variant="outline" icon={RiDownloadLine} loading={exporting} onClick={exportCsv}>{t('Export CSV')}</Button>
          <Button icon={RiAddLine} onClick={() => setAdding(true)}>{t('Add user')}</Button>
        </>}
      />
      <Card padded={false}>
        <div className="flex flex-wrap gap-3 border-b border-[var(--c-border)] p-4">
          <div className="relative min-w-56 flex-1">
            <RiSearchLine size={16} className="pointer-events-none absolute left-3 top-3 text-[var(--c-muted)]" />
            <Input placeholder={t('Search by name or email')} value={search} onChange={(e) => { setSearch(e.target.value); setParam('page', '') }} className="pl-9" />
          </div>
          <div className="w-56">
            <Select value={tenantId} onChange={(e) => setParam('tenant_id', e.target.value)}>
              <option value="">{t('Choose an organisation')}</option>
              {(tenants ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </div>
          <div className="w-48">
            <Select value={status} onChange={(e) => setParam('status', e.target.value)}>
              <option value="">{t('Active and paused')}</option>
              <option value="active">{t('Active')}</option>
              <option value="paused">{t('Paused')}</option>
              <option value="deleted">{t('Deleted')}</option>
              <option value="unverified">{t('Not verified')}</option>
              <option value="platform_admin">{t('Platform admins')}</option>
            </Select>
          </div>
        </div>
        {!tenantId ? (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <RiBuilding2Line size={28} className="text-[var(--c-muted)]" />
            <p className="font-medium">{t('Choose an organisation to see its users.')}</p>
            <p className="text-sm text-[var(--c-muted)]">{t('Pick one from the list above.')}</p>
          </div>
        ) : (<>
          {picked.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-[var(--c-border)] bg-[var(--c-brand-soft)] px-5 py-2.5">
              <span className="mr-auto text-sm font-semibold">{t('{count} selected', { count: picked.size })}</span>
              <Button size="sm" variant="outline" icon={RiPauseCircleLine} disabled={!eligible.pause.length} onClick={() => setBulk('pause')}>{t('Pause ({count})', { count: eligible.pause.length })}</Button>
              <Button size="sm" variant="outline" icon={RiPlayCircleLine} disabled={!eligible.resume.length} onClick={() => setBulk('resume')}>{t('Resume ({count})', { count: eligible.resume.length })}</Button>
              <Button size="sm" variant="outline" icon={RiKey2Line} disabled={!eligible.link.length} onClick={() => setBulk('link')}>{t('Send password link ({count})', { count: eligible.link.length })}</Button>
              <Button size="sm" variant="ghost" onClick={() => setPicked(new Map())}>{t('Clear')}</Button>
            </div>
          )}
          <Table
            rows={rows}
            selected={new Set(picked.keys())}
            onSelect={onSelect}
            loading={loading}
            error={error}
            onRowClick={(u) => navigate(`/users/${u.id}`)}
            empty={t('No user matches.')}
            columns={[
              { key: 'name', header: t('User'), render: (u) => <><p className="flex items-center gap-1.5 font-medium">{u.name}{u.locked && <RiLockLine size={14} title={t('Locked out')} className="text-[var(--c-bad)]" />}</p><p className="text-xs text-[var(--c-muted)]">{u.email}</p></> },
              { key: 'tenant', header: t('Signed in to'), render: (u) => <><p>{u.tenant?.name ?? '—'}</p>{u.organisations_count > 1 && <p className="text-xs text-[var(--c-muted)]">{t('+{count} more', { count: u.organisations_count - 1 })}</p>}</> },
              { key: 'role', header: t('Role'), render: (u) => roleLabel(u.role) },
              { key: 'status', header: t('Status'), render: (u) => (
                <span className="flex flex-wrap gap-1">
                  <StatusBadge status={u.status} />
                  {u.locked && <Badge tone="bad">{t('Locked out')}</Badge>}
                  {!u.email_verified && u.status !== 'erased' && <Badge tone="warn">{t('Not verified')}</Badge>}
                  {u.is_platform_admin && <Badge tone="brand">{t('Platform admin')}</Badge>}
                </span>
              ) },
              status === 'deleted'
                ? { key: 'purge', header: t('Erased'), render: (u) => (u.status === 'erased' ? t('Already') : <span title={formatDate(u.purge_at)}>{timeAgo(u.purge_at)}</span>) }
                : { key: 'created', header: t('Created'), render: (u) => formatDate(u.created_at) },
            ]}
          />
          <Pagination meta={data?.meta} onPage={(p) => setParam('page', String(p))} />
        </>)}
      </Card>
      {bulk === 'pause' && (
        <ActionModal title={t('Pause {count} users?', { count: eligible.pause.length })} actionLabel={t('Pause them')} danger reason reasonPlaceholder={t('e.g. Left the company')} onClose={() => setBulk(null)}
          run={({ reason }) => runBulk(eligible.pause, (u) => pauseUser(u.id, reason), '{count} paused.')}>
          {t('They are signed out everywhere and can’t sign in until resumed.')}
        </ActionModal>
      )}
      {bulk === 'resume' && (
        <ActionModal title={t('Resume {count} users?', { count: eligible.resume.length })} actionLabel={t('Resume them')} onClose={() => setBulk(null)}
          run={() => runBulk(eligible.resume, (u) => resumeUser(u.id), '{count} resumed.')}>
          {t('They can sign in again.')}
        </ActionModal>
      )}
      {bulk === 'link' && (
        <ActionModal title={t('Email {count} users?', { count: eligible.link.length })} actionLabel={t('Send')} onClose={() => setBulk(null)}
          run={() => runBulk(eligible.link, (u) => sendPasswordLink(u.id), '{count} emailed.')}>
          {t('Anyone who hasn’t accepted their invitation gets it again; everyone else gets a password reset link.')}
        </ActionModal>
      )}
      {adding && <AddUser tenantId={tenantId} onClose={() => setAdding(false)} onAdded={(u) => navigate(`/users/${u.id}`)} />}
    </>
  )
}

/** Adds a new or existing sign-in to one organisation with a role. */
function AddUser({ tenantId, onClose, onAdded }) {
  const toast = useToast()
  const { t } = useI18n()
  const { data: org, loading } = useResource(() => getTenant(tenantId), [tenantId])
  const [form, setForm] = useState({ name: '', email: '', role: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const user = await addMember(tenantId, { ...form, name: form.name || undefined })
      toast.success(t('{email} was added to {name} and has been emailed.', { email: user.email, name: org.name }))
      onAdded(user)
    } catch (err) {
      setErrors(err.fields ?? {})
      if (!err.fields || Object.keys(err.fields).length === 0) toast.error(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={org ? t('Add a user to {name}', { name: org.name }) : t('Add user')}
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button><Button type="submit" form="add-user" loading={busy} disabled={loading}>{t('Add user')}</Button></>}
    >
      {loading ? <Spinner /> : (
        <form id="add-user" onSubmit={submit} className="space-y-4">
          <p className="text-sm text-[var(--c-muted)]">{t('A new person gets an email to choose a password; someone who already has a sign-in is added and told.')}</p>
          <Input label={t('Email')} type="email" required value={form.email} onChange={set('email')} error={errors.email} autoFocus />
          <Input label={t('Name')} value={form.name} onChange={set('name')} error={errors.name} hint={t('Needed only for someone new.')} />
          <Select label={t('Role')} required value={form.role} onChange={set('role')} error={errors.role}>
            <option value="" disabled>{t('Choose a role')}</option>
            {(org?.roles ?? []).map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
          </Select>
        </form>
      )}
    </Modal>
  )
}
