import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RiAddLine, RiDownloadLine, RiSearchLine } from 'react-icons/ri'
import { createTenant, listTenants } from '../api/platform'
import { useI18n } from '../i18n/context'
import { useResource } from '../lib/useResource'
import { useDebounced } from '../lib/useDebounced'
import { formatDate, formatNumber, timeAgo } from '../lib/format'
import { downloadCsv, fetchAll, toCsv } from '../lib/csv'
import { useToast } from '../components/toast'
import StatusBadge from '../components/StatusBadge'
import { Button, Card, Input, Modal, PageHeader, Pagination, Select, Table } from '../components/ui'

export default function OrganisationsPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const status = params.get('status') ?? ''
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const q = useDebounced(search)
  const { data, loading, error } = useResource(() => listTenants({ search: q, status, page }), [q, status, page])
  const setStatus = (value) => { setParams(value ? { status: value } : {}, { replace: true }); setPage(1) }
  const toast = useToast()
  const [exporting, setExporting] = useState(false)

  async function exportCsv() {
    setExporting(true)
    try {
      const all = await fetchAll(listTenants, { search: q, status })
      downloadCsv(`organisations-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([
        { header: 'Name', value: (r) => r.name },
        { header: 'Domain', value: (r) => r.domain || r.slug },
        { header: 'Owner', value: (r) => r.owner_email },
        { header: 'Users', value: (r) => r.users_count },
        { header: 'Employees', value: (r) => r.employees_count },
        { header: 'Last payroll', value: (r) => r.last_payroll_period },
        { header: 'Status', value: (r) => r.status },
        { header: 'Joined', value: (r) => r.created_at },
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
        title={t('Organisations')}
        subtitle={t('Every organisation on the platform. Open one to see its people, pause it or delete it.')}
        actions={<>
          <Button variant="outline" icon={RiDownloadLine} loading={exporting} onClick={exportCsv}>{t('Export CSV')}</Button>
          <Button icon={RiAddLine} onClick={() => setCreating(true)}>{t('New organisation')}</Button>
        </>}
      />
      <Card padded={false}>
        <div className="flex flex-wrap gap-3 border-b border-[var(--c-border)] p-4">
          <div className="relative min-w-56 flex-1">
            <RiSearchLine size={16} className="pointer-events-none absolute left-3 top-3 text-[var(--c-muted)]" />
            <Input placeholder={t('Search by name, slug or domain')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
          </div>
          <div className="w-52">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{t('Active and paused')}</option>
              <option value="active">{t('Active')}</option>
              <option value="paused">{t('Paused')}</option>
              <option value="deleted">{t('Deleted (restorable)')}</option>
            </Select>
          </div>
        </div>
        <Table
          rows={data?.data ?? []}
          loading={loading}
          error={error}
          onRowClick={(r) => navigate(`/organisations/${r.id}`)}
          empty={status === 'deleted' ? t('No deleted organisations.') : q || status ? t('No organisation matches.') : t('No organisations yet.')}
          columns={[
            { key: 'name', header: t('Organisation'), render: (r) => <><p className="font-medium">{r.name}</p><p className="text-xs text-[var(--c-muted)]">{r.domain || r.slug}</p></> },
            { key: 'owner', header: t('Owner'), render: (r) => <span className="text-[var(--c-muted)]">{r.owner_email ?? '—'}</span> },
            { key: 'users', header: t('Users'), render: (r) => formatNumber(r.users_count) },
            { key: 'employees', header: t('Employees'), render: (r) => formatNumber(r.employees_count) },
            { key: 'payroll', header: t('Last payroll'), render: (r) => r.last_payroll_period ?? '—' },
            { key: 'status', header: t('Status'), render: (r) => <StatusBadge status={r.status} /> },
            status === 'deleted'
              ? { key: 'purge', header: t('Removed for good'), render: (r) => <span title={formatDate(r.purge_at)}>{timeAgo(r.purge_at)}</span> }
              : { key: 'created', header: t('Joined'), render: (r) => formatDate(r.created_at) },
          ]}
        />
        <Pagination meta={data?.meta} onPage={setPage} />
      </Card>
      {creating && <CreateOrganisation onClose={() => setCreating(false)} onCreated={(r) => navigate(`/organisations/${r.id}`)} />}
    </>
  )
}

function CreateOrganisation({ onClose, onCreated }) {
  const toast = useToast()
  const { t } = useI18n()
  const [form, setForm] = useState({ name: '', domain: '', owner_name: '', owner_email: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    try {
      const tenant = await createTenant({ ...form, domain: form.domain || undefined })
      toast.success(t('{name} is ready. {email} has been emailed.', { name: tenant.name, email: form.owner_email }))
      onCreated(tenant)
    } catch (err) {
      setErrors(err.fields ?? {})
      if (!err.fields || Object.keys(err.fields).length === 0) toast.error(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={t('New organisation')}
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button><Button type="submit" form="new-org" loading={busy}>{t('Create organisation')}</Button></>}
    >
      <form id="new-org" onSubmit={submit} className="space-y-4">
        <Input label={t('Organisation name')} required value={form.name} onChange={set('name')} error={errors.name} />
        <Input label={t('Domain')} placeholder="acme.hrmspay.com" value={form.domain} onChange={set('domain')} error={errors.domain} hint={t('Leave blank to use the name, e.g. acme.hrmspay.com.')} />
        <div className="rounded-xl bg-[var(--c-input)] p-4">
          <p className="mb-3 text-xs font-semibold text-[var(--c-muted)]">{t('The owner runs the organisation as its admin. A new person gets an email to choose a password; someone who already has a sign-in is added and told.')}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t('Owner name')} required value={form.owner_name} onChange={set('owner_name')} error={errors.owner_name} className="bg-[var(--c-surface)]" />
            <Input label={t('Owner email')} type="email" required value={form.owner_email} onChange={set('owner_email')} error={errors.owner_email} className="bg-[var(--c-surface)]" />
          </div>
        </div>
      </form>
    </Modal>
  )
}
