import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RiArrowGoBackLine, RiDeleteBinLine, RiEditLine, RiFileList3Line, RiPauseCircleLine, RiPlayCircleLine } from 'react-icons/ri'
import * as platform from '../api/platform'
import { useAuth } from '../auth/context'
import { useI18n } from '../i18n/context'
import { useResource } from '../lib/useResource'
import { formatDate, formatNumber, roleLabel } from '../lib/format'
import { useToast } from '../components/toast'
import ActionModal from '../components/ActionModal'
import ActivityFeed from '../components/ActivityFeed'
import BackLink from '../components/BackLink'
import { DangerRow, DangerZone } from '../components/DangerZone'
import LifecycleBanner from '../components/LifecycleBanner'
import StatusBadge from '../components/StatusBadge'
import { Badge, Button, Card, Details, Input, Modal, PageHeader, Spinner, Table } from '../components/ui'

export default function OrganisationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { t } = useI18n()
  const { user: me } = useAuth()
  const { data: org, loading, error, setData } = useResource(() => platform.getTenant(id), [id])
  const history = useResource(() => platform.listActivity({ subject_type: 'tenant', subject_id: id, per_page: 15 }).then((r) => r.data), [id])
  const [editing, setEditing] = useState(false)
  const [action, setAction] = useState(null)
  const [busy, setBusy] = useState(false)

  if (loading) return <Spinner />
  if (error) return <p className="text-sm text-[var(--c-bad)]">{error}</p>

  const isMine = org.id === me.tenant_id
  const deleted = org.status === 'deleted'
  const name = org.name

  /** Applies an updated organisation and refreshes its history. */
  function done(next, message) {
    setData({ ...org, ...next })
    history.reload({ quiet: true })
    toast.success(message)
    setAction(null)
  }

  async function quick(call, message) {
    setBusy(true)
    try {
      const next = await call()
      done(next, typeof message === 'function' ? message(next) : message)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const actions = {
    pause: {
      title: t('Pause {name}?', { name }), actionLabel: t('Pause organisation'), danger: true, reason: true, reasonPlaceholder: t('e.g. Invoice 2026-10 unpaid'),
      body: t('Everyone at {name} is stopped straight away, including anyone signed in now. Their data stays exactly as it is, and you can resume it at any time.', { name }),
      run: ({ reason }) => platform.pauseTenant(org.id, reason).then((next) => done(next, t('{name} is paused.', { name }))),
    },
    delete: {
      title: t('Delete {name}?', { name }), actionLabel: t('Delete organisation'), danger: true, reason: true, confirmText: name, reasonPlaceholder: t('e.g. Customer closed their account'),
      body: t('{name} disappears from the platform and nobody can use it. People who also belong to another organisation carry on there. You can restore it for 30 days; after that it is removed for good.', { name }),
      run: ({ reason, confirm }) => platform.deleteTenant(org.id, confirm, reason).then((next) => done(next, t('{name} is deleted. You can restore it for 30 days.', { name }))),
    },
    purge: {
      title: t('Remove {name} for good?', { name }), actionLabel: t('Remove for good'), danger: true, confirmText: name,
      body: <><b className="text-[var(--c-bad)]">{t('This can’t be undone.')}</b> {t('Every employee, payroll run, document and setting at {name} is deleted, along with its files on HRMS storage and the sign-ins of people who belong nowhere else.', { name })}</>,
      run: ({ confirm }) => platform.purgeTenant(org.id, confirm).then((r) => {
        toast.success(t('{name} was removed: {employees} employees and {people} sign-ins.', { name, employees: r.data.employees, people: r.data.people_removed }))
        navigate('/organisations?status=deleted')
      }),
    },
  }
  const a = action && actions[action]

  return (
    <>
      <PageHeader
        back={<BackLink to={deleted ? '/organisations?status=deleted' : '/organisations'}>{t('Organisations')}</BackLink>}
        title={<span className="flex flex-wrap items-center gap-3">{name}<StatusBadge status={org.status} />{isMine && <Badge tone="brand">{t('You’re signed in here')}</Badge>}</span>}
        subtitle={org.domain || org.slug}
        actions={deleted
          ? <Button icon={RiArrowGoBackLine} loading={busy} onClick={() => quick(() => platform.restoreTenant(org.id), (next) => (next.status === 'paused' ? t('{name} is restored. It is still paused.', { name }) : t('{name} is restored.', { name })))}>{t('Restore')}</Button>
          : <>
            <Button variant="outline" icon={RiFileList3Line} onClick={() => navigate(`/audit?tenant_id=${org.id}`)}>{t('Audit log')}</Button>
            <Button variant="outline" icon={RiEditLine} onClick={() => setEditing(true)}>{t('Edit')}</Button>
            {org.status === 'paused'
              ? <Button icon={RiPlayCircleLine} loading={busy} onClick={() => quick(() => platform.resumeTenant(org.id), t('{name} is running again.', { name }))}>{t('Resume')}</Button>
              : <Button variant="outline" icon={RiPauseCircleLine} disabled={isMine} title={isMine ? t('You can’t pause the organisation you’re signed in to') : undefined} onClick={() => setAction('pause')}>{t('Pause')}</Button>}
          </>}
      />

      <LifecycleBanner record={org} kind="organisation" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title={t('Details')} className="lg:col-span-2">
          <Details items={[
            [t('Owner'), org.owner_email],
            [t('Slug (careers page)'), <span className="font-mono text-xs">{org.slug}</span>],
            [t('Storage'), org.storage_driver],
            ['DD-Sign', org.signatures_connected ? <Badge tone="ok">{t('Connected')}</Badge> : <Badge>{t('Not connected')}</Badge>],
            [t('Last payroll period'), org.last_payroll_period],
            [t('Joined the platform'), formatDate(org.created_at)],
          ]} />
        </Card>
        <Card title={t('In numbers')}>
          <div className="space-y-3 text-sm">
            <p className="flex justify-between"><span className="text-[var(--c-muted)]">{t('Active employees')}</span><b className="tabular-nums">{formatNumber(org.employees_count)}</b></p>
            <p className="flex justify-between"><span className="text-[var(--c-muted)]">{t('Users with access')}</span><b className="tabular-nums">{formatNumber(org.users_count)}</b></p>
            <p className="flex justify-between"><span className="text-[var(--c-muted)]">{t('Roles')}</span><b className="tabular-nums">{formatNumber(org.roles.length)}</b></p>
          </div>
        </Card>
      </div>

      <Card title={t('People ({count})', { count: org.members.length })} className="mt-4" padded={false}>
        <Table
          rows={org.members}
          onRowClick={(m) => navigate(`/users/${m.id}`)}
          empty={t('Nobody has access to this organisation.')}
          columns={[
            { key: 'name', header: t('Name'), render: (m) => <><p className="font-medium">{m.name}{m.is_owner && <span className="ml-2"><Badge tone="brand">{t('Owner')}</Badge></span>}</p><p className="text-xs text-[var(--c-muted)]">{m.email}</p></> },
            { key: 'role', header: t('Role here'), render: (m) => roleLabel(m.role) },
            { key: 'status', header: t('Access'), render: (m) => (m.is_deleted ? <Badge tone="bad">{t('Deleted')}</Badge> : m.is_active ? <Badge tone="ok">{t('Active')}</Badge> : <Badge tone="warn">{t('Off')}</Badge>) },
            { key: 'joined', header: t('Joined'), render: (m) => formatDate(m.joined_at) },
          ]}
        />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title={t('History')} className="lg:col-span-2" padded={false}>
          {history.loading && !history.data ? <Spinner /> : <ActivityFeed entries={history.data ?? []} showSubject={false} empty={t('No platform admin has changed this organisation yet.')} />}
        </Card>
        <DangerZone title={t('Danger zone')}>
          {deleted ? (
            <DangerRow title={t('Remove for good')} text={t('Deletes everything at this organisation now, without waiting out the 30 days.')} button={<Button variant="danger" size="sm" icon={RiDeleteBinLine} onClick={() => setAction('purge')}>{t('Remove for good')}</Button>} />
          ) : (
            <DangerRow
              title={t('Delete organisation')}
              text={isMine ? t('You can’t delete the organisation you’re signed in to. Switch to another first.') : t('Hide it and stop everyone using it. Restorable for 30 days.')}
              button={<Button variant="danger" size="sm" icon={RiDeleteBinLine} disabled={isMine} onClick={() => setAction('delete')}>{t('Delete')}</Button>}
            />
          )}
        </DangerZone>
      </div>

      {editing && <EditOrganisation tenant={org} onClose={() => setEditing(false)} onSaved={(next) => { done(next, t('Saved.')); setEditing(false) }} />}
      {a && (
        <ActionModal title={a.title} actionLabel={a.actionLabel} danger={a.danger} reason={a.reason} reasonPlaceholder={a.reasonPlaceholder} confirmText={a.confirmText} run={a.run} onClose={() => setAction(null)}>
          {a.body}
        </ActionModal>
      )}
    </>
  )
}

function EditOrganisation({ tenant, onClose, onSaved }) {
  const toast = useToast()
  const { t } = useI18n()
  const [form, setForm] = useState({ name: tenant.name, domain: tenant.domain ?? '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      onSaved(await platform.updateTenant(tenant.id, { name: form.name, domain: form.domain || null }))
    } catch (err) {
      setErrors(err.fields ?? {})
      toast.error(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal title={t('Edit organisation')} onClose={onClose} footer={<><Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button><Button type="submit" form="edit-org" loading={busy}>{t('Save')}</Button></>}>
      <form id="edit-org" onSubmit={submit} className="space-y-4">
        <Input label={t('Name')} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
        <Input label={t('Domain')} value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} error={errors.domain} />
      </form>
    </Modal>
  )
}
