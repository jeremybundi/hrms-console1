import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiAddLine, RiSearchLine } from 'react-icons/ri'
import { createTenant, listTenants } from '../api/platform'
import { useResource } from '../lib/useResource'
import { useDebounced } from '../lib/useDebounced'
import { formatDate, formatNumber } from '../lib/format'
import { useToast } from '../components/toast'
import { Badge, Button, Card, Input, Modal, PageHeader, Pagination, Select, Table } from '../components/ui'

export default function OrganisationsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const q = useDebounced(search)
  const { data, loading, error } = useResource(() => listTenants({ search: q, status, page }), [q, status, page])

  return (
    <>
      <PageHeader
        title="Organisations"
        subtitle="Every organisation on the platform. Open one to see its people and switch it on or off."
        actions={<Button icon={RiAddLine} onClick={() => setCreating(true)}>New organisation</Button>}
      />
      <Card padded={false}>
        <div className="flex flex-wrap gap-3 border-b border-[var(--c-border)] p-4">
          <div className="relative min-w-56 flex-1">
            <RiSearchLine size={16} className="pointer-events-none absolute left-3 top-3 text-[var(--c-muted)]" />
            <Input placeholder="Search by name, slug or domain" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="pl-9" />
          </div>
          <div className="w-44">
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Switched off</option>
            </Select>
          </div>
        </div>
        <Table
          rows={data?.data ?? []}
          loading={loading}
          error={error}
          onRowClick={(t) => navigate(`/organisations/${t.id}`)}
          empty={q || status ? 'No organisation matches.' : 'No organisations yet.'}
          columns={[
            { key: 'name', header: 'Organisation', render: (t) => <><p className="font-medium">{t.name}</p><p className="text-xs text-[var(--c-muted)]">{t.domain || t.slug}</p></> },
            { key: 'owner', header: 'Owner', render: (t) => <span className="text-[var(--c-muted)]">{t.owner_email ?? '—'}</span> },
            { key: 'users', header: 'Users', render: (t) => formatNumber(t.users_count) },
            { key: 'employees', header: 'Employees', render: (t) => formatNumber(t.employees_count) },
            { key: 'payroll', header: 'Last payroll', render: (t) => t.last_payroll_period ?? '—' },
            { key: 'status', header: 'Status', render: (t) => (t.is_active ? <Badge tone="ok">Active</Badge> : <Badge tone="bad">Switched off</Badge>) },
            { key: 'created', header: 'Joined', render: (t) => formatDate(t.created_at) },
          ]}
        />
        <Pagination meta={data?.meta} onPage={setPage} />
      </Card>
      {creating && <CreateOrganisation onClose={() => setCreating(false)} onCreated={(t) => navigate(`/organisations/${t.id}`)} />}
    </>
  )
}

function CreateOrganisation({ onClose, onCreated }) {
  const toast = useToast()
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
      toast.success(`${tenant.name} is ready. ${form.owner_email} has been emailed.`)
      onCreated(tenant)
    } catch (err) {
      setErrors(err.fields ?? {})
      if (!err.fields || Object.keys(err.fields).length === 0) toast.error(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title="New organisation"
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="new-org" loading={busy}>Create organisation</Button></>}
    >
      <form id="new-org" onSubmit={submit} className="space-y-4">
        <Input label="Organisation name" required value={form.name} onChange={set('name')} error={errors.name} />
        <Input label="Domain" placeholder="acme.hrmspay.com" value={form.domain} onChange={set('domain')} error={errors.domain} hint="Leave blank to use the name, e.g. acme.hrmspay.com." />
        <div className="rounded-xl bg-[var(--c-input)] p-4">
          <p className="mb-3 text-xs font-semibold text-[var(--c-muted)]">The owner runs the organisation as its admin. A new person gets an email to choose a password; someone who already has a sign-in is added and told.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Owner name" required value={form.owner_name} onChange={set('owner_name')} error={errors.owner_name} className="bg-[var(--c-surface)]" />
            <Input label="Owner email" type="email" required value={form.owner_email} onChange={set('owner_email')} error={errors.owner_email} className="bg-[var(--c-surface)]" />
          </div>
        </div>
      </form>
    </Modal>
  )
}
