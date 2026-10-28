import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RiArrowGoBackLine, RiDeleteBinLine, RiEraserLine, RiFileList3Line, RiKey2Line, RiLockUnlockLine, RiLogoutCircleRLine, RiPauseCircleLine, RiPlayCircleLine, RiShieldUserLine } from 'react-icons/ri'
import * as platform from '../api/platform'
import { useAuth } from '../auth/context'
import { useI18n } from '../i18n/context'
import { useResource } from '../lib/useResource'
import { formatDate, formatDateTime, roleLabel, timeAgo } from '../lib/format'
import { useToast } from '../components/toast'
import ActionModal from '../components/ActionModal'
import ActivityFeed from '../components/ActivityFeed'
import BackLink from '../components/BackLink'
import { DangerRow, DangerZone } from '../components/DangerZone'
import LifecycleBanner from '../components/LifecycleBanner'
import StatusBadge from '../components/StatusBadge'
import { Badge, Button, Card, Details, Modal, PageHeader, Select, Spinner, Table, Toggle } from '../components/ui'

export default function UserPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const { data: u, loading, error, setData } = useResource(() => platform.getUser(id), [id])
  const history = useResource(() => platform.listActivity({ subject_type: 'user', subject_id: id, per_page: 15 }).then((r) => r.data), [id])
  const [action, setAction] = useState(null)
  const [busy, setBusy] = useState(null)
  const [roleFor, setRoleFor] = useState(null)

  if (loading) return <Spinner />
  if (error) return <p className="text-sm text-[var(--c-bad)]">{error}</p>

  const isMe = u.id === me.id
  const gone = u.status === 'deleted' || u.status === 'erased'
  const name = u.name

  /** Runs one quick action and shows its result; the updated user is kept when the call returns one. */
  async function act(key, call, success) {
    setBusy(key)
    try {
      const res = await call()
      if (res && res.id === u.id) setData(res)
      history.reload({ quiet: true })
      toast.success(typeof success === 'function' ? success(res) : success)
      setRoleFor(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(null)
    }
  }

  /** For the modals, which show the API's error themselves. */
  const finish = (res, message) => {
    if (res && res.id === u.id) setData(res)
    history.reload({ quiet: true })
    toast.success(message)
    setAction(null)
  }

  const actions = {
    pause: {
      title: t('Pause {name}?', { name }), actionLabel: t('Pause'), danger: true, reason: true, reasonPlaceholder: t('e.g. Suspicious sign-ins reported'),
      body: t('They’re signed out everywhere now ({count} sessions) and can’t sign in to any organisation until you resume them.', { count: u.sessions }),
      run: ({ reason }) => platform.pauseUser(u.id, reason).then((res) => finish(res, t('{name} is paused.', { name }))),
    },
    delete: {
      title: t('Delete {name}?', { name }), actionLabel: t('Delete'), danger: true, reason: true, reasonPlaceholder: t('e.g. Left the company'),
      body: t('They’re signed out, hidden from every organisation’s staff list, and can’t sign in. Their email can’t be invited again while deleted. You can restore them for 30 days; after that their details are erased for good.'),
      run: ({ reason }) => platform.deleteUser(u.id, reason).then((res) => finish(res, t('{name} is deleted. You can restore them for 30 days.', { name }))),
    },
    erase: {
      title: t('Erase {name} for good?', { name }), actionLabel: t('Erase for good'), danger: true, confirmText: u.email,
      body: <><b className="text-[var(--c-bad)]">{t('This can’t be undone.')}</b> {t('Their name, email and password are wiped and they’re removed from every organisation. Payroll, approvals and audit entries they were part of stay, shown as “Erased user”.')}</>,
      run: ({ confirm }) => platform.eraseUser(u.id, confirm).then((res) => finish(res, t('Erased for good.'))),
    },
    admin: {
      title: u.is_platform_admin ? t('Remove {name} from the console?', { name }) : t('Make {name} a platform admin?', { name }),
      actionLabel: u.is_platform_admin ? t('Remove access') : t('Make platform admin'), danger: !u.is_platform_admin,
      body: u.is_platform_admin ? t('They will no longer be able to open this console.') : t('They will see and change every organisation and every user on the platform, as you can.'),
      run: () => platform.updateUser(u.id, { is_platform_admin: !u.is_platform_admin }).then((res) => finish(res, u.is_platform_admin ? t('Console access removed.') : t('{name} is now a platform admin.', { name }))),
    },
    signout: {
      title: t('End every session?'), actionLabel: t('Sign them out'), danger: true,
      body: t('{name} is signed out on every device and has to sign in again.', { name }),
      run: () => platform.signOutUser(u.id).then(() => { setData({ ...u, sessions: 0 }); finish(null, t('Signed out everywhere.')) }),
    },
  }
  const a = action && actions[action]

  return (
    <>
      <PageHeader
        back={<BackLink to={gone ? '/users?status=deleted' : '/users'}>{t('Users')}</BackLink>}
        title={<span className="flex flex-wrap items-center gap-3">{name}<StatusBadge status={u.status} />{isMe && <Badge tone="brand">{t('You')}</Badge>}</span>}
        subtitle={<span className="flex flex-wrap items-center gap-2">{u.email}{u.locked && <Badge tone="bad">{t('Locked out')}</Badge>}{!u.email_verified && !gone && <Badge tone="warn">{t('Not verified')}</Badge>}{u.is_platform_admin && <Badge tone="brand">{t('Platform admin')}</Badge>}</span>}
        actions={u.status === 'deleted'
          ? <Button icon={RiArrowGoBackLine} loading={busy === 'restore'} onClick={() => act('restore', () => platform.restoreUser(u.id), (r) => (r.status === 'paused' ? t('{name} is restored, still paused.', { name }) : t('{name} is restored.', { name })))}>{t('Restore')}</Button>
          : u.status === 'erased' ? null : <>
            <Button variant="outline" icon={RiFileList3Line} onClick={() => navigate(`/audit?actor_id=${u.id}`)}>{t('Audit log')}</Button>
            <Button variant="outline" icon={RiKey2Line} loading={busy === 'password'} onClick={() => act('password', () => platform.sendPasswordLink(u.id), u.email_verified ? t('A password reset link was sent.') : t('The invitation was sent again.'))}>
              {u.email_verified ? t('Send password reset') : t('Resend invitation')}
            </Button>
            {u.locked && <Button icon={RiLockUnlockLine} loading={busy === 'unlock'} onClick={() => act('unlock', () => platform.unlockUser(u.id), t('{name} can sign in again.', { name }))}>{t('Unlock')}</Button>}
            {u.status === 'paused'
              ? <Button icon={RiPlayCircleLine} loading={busy === 'resume'} onClick={() => act('resume', () => platform.resumeUser(u.id), t('{name} can sign in again.', { name }))}>{t('Resume')}</Button>
              : !isMe && <Button variant="outline" icon={RiPauseCircleLine} onClick={() => setAction('pause')}>{t('Pause')}</Button>}
          </>}
      />

      <LifecycleBanner record={u} kind="user" />
      {u.locked && !gone && (
        <p className="mb-4 rounded-xl border border-[var(--c-bad)]/30 bg-[var(--c-bad-soft)] px-4 py-3 text-sm text-[var(--c-bad)]">
          {t('Locked out after too many wrong passwords. It clears by itself after a few minutes, or unlock it now.')}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title={t('Sign-in')} className="lg:col-span-2">
          <Details items={[
            [t('Signed in to'), u.tenant ? <Link to={`/organisations/${u.tenant.id}`} className="text-[var(--c-brand)] hover:underline">{u.tenant.name}</Link> : '—'],
            [t('Role there'), roleLabel(u.role)],
            [t('Last signed in'), u.last_sign_in_at ? `${timeAgo(u.last_sign_in_at)} · ${formatDateTime(u.last_sign_in_at)}` : t('Never')],
            [t('Open sessions'), u.sessions],
            [t('Email verified'), u.email_verified ? t('Yes') : t('Not yet: they haven’t accepted their invitation')],
            [t('Password last changed'), formatDate(u.password_changed_at)],
            [t('Created'), formatDate(u.created_at)],
          ]} />
        </Card>
        <Card title={t('Security')}>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold"><RiShieldUserLine size={16} />{t('Platform admin')}</p>
                <p className="mt-0.5 text-xs text-[var(--c-muted)]">{t('Can open this console.')}{isMe && ` ${t('You can’t remove your own access.')}`}</p>
              </div>
              <Toggle label={t('Platform admin')} checked={u.is_platform_admin} disabled={isMe || gone} onChange={() => setAction('admin')} />
            </div>
            <Button variant="outline" size="sm" icon={RiLogoutCircleRLine} disabled={u.sessions === 0} onClick={() => setAction('signout')} className="w-full">
              {t('Sign out everywhere')}{u.sessions ? ` (${u.sessions})` : ''}
            </Button>
          </div>
        </Card>
      </div>

      <Card title={t('Organisations')} className="mt-4" padded={false}>
        <Table
          rows={u.memberships.map((m) => ({ ...m, id: m.tenant_id }))}
          empty={t('Not in any organisation.')}
          columns={[
            { key: 'org', header: t('Organisation'), render: (m) => (
              <span className="flex flex-wrap items-center gap-2">
                <Link to={`/organisations/${m.tenant_id}`} className="font-medium hover:underline">{m.tenant_name}</Link>
                {m.is_current && <Badge tone="brand">{t('Signed in here')}</Badge>}
                {m.tenant_deleted ? <Badge tone="bad">{t('Org deleted')}</Badge> : !m.tenant_active && <Badge tone="warn">{t('Org paused')}</Badge>}
              </span>
            ) },
            { key: 'role', header: t('Role'), render: (m) => <span className="flex items-center gap-2">{roleLabel(m.role)}{m.is_owner && <Badge>{t('Owner')}</Badge>}</span> },
            { key: 'access', header: t('Access'), render: (m) => (
              <Toggle
                label={t('Access to {name}', { name: m.tenant_name })}
                checked={m.is_active}
                disabled={busy !== null || gone}
                onChange={(on) => act(`access-${m.tenant_id}`, () => platform.updateMembership(u.id, m.tenant_id, { is_active: on }), on ? t('Access to {name} switched on.', { name: m.tenant_name }) : t('Access to {name} switched off.', { name: m.tenant_name }))}
              />
            ) },
            { key: 'joined', header: t('Joined'), render: (m) => formatDate(m.joined_at) },
            { key: 'actions', header: '', className: 'text-right', render: (m) => !gone && (
              <span className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => setRoleFor(m)}>{t('Change role')}</Button>
                {!m.is_current && m.is_active && m.tenant_active && (
                  <Button variant="ghost" size="sm" loading={busy === `switch-${m.tenant_id}`} onClick={() => act(`switch-${m.tenant_id}`, () => platform.switchUserTenant(u.id, m.tenant_id), t('{name} now signs in to {org}.', { name, org: m.tenant_name }))}>{t('Move here')}</Button>
                )}
              </span>
            ) },
          ]}
        />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title={t('History')} className="lg:col-span-2" padded={false}>
          {history.loading && !history.data ? <Spinner /> : <ActivityFeed entries={history.data ?? []} showSubject={false} empty={t('No platform admin has changed this sign-in yet.')} />}
        </Card>
        {u.status !== 'erased' && (
          <DangerZone title={t('Danger zone')}>
            {u.status === 'deleted' ? (
              <DangerRow title={t('Erase for good')} text={t('Wipes their personal details now, without waiting out the 30 days.')} button={<Button variant="danger" size="sm" icon={RiEraserLine} onClick={() => setAction('erase')}>{t('Erase')}</Button>} />
            ) : (
              <DangerRow
                title={t('Delete sign-in')}
                text={isMe ? t('You can’t delete your own account.') : t('Sign them out, hide them everywhere, and stop them signing in. Restorable for 30 days.')}
                button={<Button variant="danger" size="sm" icon={RiDeleteBinLine} disabled={isMe} onClick={() => setAction('delete')}>{t('Delete')}</Button>}
              />
            )}
          </DangerZone>
        )}
      </div>

      {a && (
        <ActionModal title={a.title} actionLabel={a.actionLabel} danger={a.danger} reason={a.reason} reasonPlaceholder={a.reasonPlaceholder} confirmText={a.confirmText} run={a.run} onClose={() => setAction(null)}>
          {a.body}
        </ActionModal>
      )}
      {roleFor && (
        <RoleModal
          membership={roleFor}
          busy={busy === 'role'}
          onClose={() => setRoleFor(null)}
          onSave={(role) => act('role', () => platform.updateMembership(u.id, roleFor.tenant_id, { role }), t('{name} is now {role} at {org}.', { name, role: roleLabel(role), org: roleFor.tenant_name }))}
        />
      )}
    </>
  )
}

function RoleModal({ membership, busy, onClose, onSave }) {
  const { t } = useI18n()
  const { data: roles, loading } = useResource(() => platform.getTenant(membership.tenant_id).then((r) => r.roles), [membership.tenant_id])
  const [role, setRole] = useState(membership.role)

  return (
    <Modal
      title={t('Role at {org}', { org: membership.tenant_name })}
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button><Button loading={busy} disabled={loading || role === membership.role} onClick={() => onSave(role)}>{t('Save role')}</Button></>}
    >
      {loading ? <Spinner /> : (
        <Select label={t('Role')} value={role} onChange={(e) => setRole(e.target.value)}>
          {(roles ?? []).map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
        </Select>
      )}
      <p className="mt-3 text-xs text-[var(--c-muted)]">{t('The role decides what they can see and do in this organisation. It takes effect the next time they load a page.')}</p>
    </Modal>
  )
}
