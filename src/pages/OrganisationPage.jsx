import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RiEditLine, RiPlayCircleLine, RiStopCircleLine } from 'react-icons/ri'
import { getTenant, updateTenant } from '../api/platform'
import { useResource } from '../lib/useResource'
import { formatDate, formatNumber, roleLabel } from '../lib/format'
import { useToast } from '../components/toast'
import BackLink from '../components/BackLink'
import { Badge, Button, Card, Confirm, Details, Input, Modal, PageHeader, Spinner, Table } from '../components/ui'

export default function OrganisationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: t, loading, error, setData } = useResource(() => getTenant(id), [id])
  const [editing, setEditing] = useState(false)
  const [confirmOff, setConfirmOff] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />
  if (error) return <p className="text-sm text-[var(--c-bad)]">{error}</p>

  async function setActive(isActive) {
    setBusy(true)
    try {
      const next = await updateTenant(t.id, { is_active: isActive })
      setData({ ...t, ...next })
      toast.success(isActive ? `${t.name} is switched on.` : `${t.name} is switched off. Its people can no longer sign in.`)
      setConfirmOff(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        back={<BackLink to="/organisations">Organisations</BackLink>}
        title={<span className="flex items-center gap-3">{t.name}{t.is_active ? <Badge tone="ok">Active</Badge> : <Badge tone="bad">Switched off</Badge>}</span>}
        subtitle={t.domain || t.slug}
        actions={<>
          <Button variant="outline" icon={RiEditLine} onClick={() => setEditing(true)}>Edit</Button>
          {t.is_active
            ? <Button variant="outline" icon={RiStopCircleLine} onClick={() => setConfirmOff(true)}>Switch off</Button>
            : <Button icon={RiPlayCircleLine} loading={busy} onClick={() => setActive(true)}>Switch on</Button>}
        </>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-2">
          <Details items={[
            ['Owner', t.owner_email],
            ['Slug (careers page)', <span className="font-mono text-xs">{t.slug}</span>],
            ['Storage', t.storage_driver],
            ['DD-Sign', t.signatures_connected ? <Badge tone="ok">Connected</Badge> : <Badge>Not connected</Badge>],
            ['Last payroll period', t.last_payroll_period],
            ['Joined the platform', formatDate(t.created_at)],
          ]} />
        </Card>
        <Card title="In numbers">
          <div className="space-y-3 text-sm">
            <p className="flex justify-between"><span className="text-[var(--c-muted)]">Active employees</span><b className="tabular-nums">{formatNumber(t.employees_count)}</b></p>
            <p className="flex justify-between"><span className="text-[var(--c-muted)]">Users with access</span><b className="tabular-nums">{formatNumber(t.users_count)}</b></p>
            <p className="flex justify-between"><span className="text-[var(--c-muted)]">Roles</span><b className="tabular-nums">{formatNumber(t.roles.length)}</b></p>
          </div>
        </Card>
      </div>

      <Card title={`People (${t.members.length})`} className="mt-4" padded={false}>
        <Table
          rows={t.members}
          onRowClick={(m) => navigate(`/users/${m.id}`)}
          empty="Nobody has access to this organisation."
          columns={[
            { key: 'name', header: 'Name', render: (m) => <><p className="font-medium">{m.name}{m.is_owner && <span className="ml-2"><Badge tone="brand">Owner</Badge></span>}</p><p className="text-xs text-[var(--c-muted)]">{m.email}</p></> },
            { key: 'role', header: 'Role here', render: (m) => roleLabel(m.role) },
            { key: 'status', header: 'Access', render: (m) => (m.is_active ? <Badge tone="ok">Active</Badge> : <Badge tone="bad">Off</Badge>) },
            { key: 'joined', header: 'Joined', render: (m) => formatDate(m.joined_at) },
          ]}
        />
      </Card>

      {editing && <EditOrganisation tenant={t} onClose={() => setEditing(false)} onSaved={(next) => { setData({ ...t, ...next }); setEditing(false) }} />}
      {confirmOff && (
        <Confirm title={`Switch off ${t.name}?`} danger confirmLabel="Switch off" busy={busy} onConfirm={() => setActive(false)} onClose={() => setConfirmOff(false)}>
          Nobody at {t.name} will be able to sign in until you switch it back on. Their data stays as it is.
        </Confirm>
      )}
    </>
  )
}

function EditOrganisation({ tenant, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ name: tenant.name, domain: tenant.domain ?? '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      const next = await updateTenant(tenant.id, { name: form.name, domain: form.domain || null })
      toast.success('Saved.')
      onSaved(next)
    } catch (err) {
      setErrors(err.fields ?? {})
      toast.error(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal title="Edit organisation" onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="edit-org" loading={busy}>Save</Button></>}>
      <form id="edit-org" onSubmit={submit} className="space-y-4">
        <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <Input label="Domain" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} error={errors.domain} />
      </form>
    </Modal>
  )
}
