import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RiKey2Line, RiLockUnlockLine, RiLogoutCircleRLine, RiShieldUserLine, RiUserForbidLine, RiUserFollowLine } from 'react-icons/ri'
import * as platform from '../api/platform'
import { useAuth } from '../auth/context'
import { useResource } from '../lib/useResource'
import { formatDate, formatDateTime, roleLabel, timeAgo } from '../lib/format'
import { useToast } from '../components/toast'
import BackLink from '../components/BackLink'
import { Status } from './UsersPage'
import { Badge, Button, Card, Confirm, Details, Modal, PageHeader, Select, Spinner, Table, Toggle } from '../components/ui'

export default function UserPage() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const toast = useToast()
  const { data: u, loading, error, setData } = useResource(() => platform.getUser(id), [id])
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(null)
  const [roleFor, setRoleFor] = useState(null)

  if (loading) return <Spinner />
  if (error) return <p className="text-sm text-[var(--c-bad)]">{error}</p>

  const isMe = u.id === me.id

  /** Runs one action, showing its result; `next` is the updated user when the call returns one. */
  async function act(key, call, success) {
    setBusy(key)
    try {
      const res = await call()
      if (res && res.id === u.id) setData(res)
      toast.success(typeof success === 'function' ? success(res) : success)
      setConfirm(null)
      setRoleFor(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(null)
    }
  }

  const confirms = {
    off: {
      title: `Switch off ${u.name}?`, label: 'Switch off', danger: true,
      body: <>They can’t sign in to any organisation, and the {u.sessions} session{u.sessions === 1 ? '' : 's'} they have open end now.</>,
      run: () => act('off', () => platform.updateUser(u.id, { is_active: false }), `${u.name} is switched off.`),
    },
    signout: {
      title: 'End every session?', label: 'Sign them out', danger: true,
      body: <>{u.name} is signed out on every device and has to sign in again.</>,
      run: () => act('signout', () => platform.signOutUser(u.id).then((r) => { setData({ ...u, sessions: 0 }); return r }), (r) => r.message),
    },
    admin: {
      title: u.is_platform_admin ? `Remove ${u.name} from the console?` : `Make ${u.name} a platform admin?`,
      label: u.is_platform_admin ? 'Remove access' : 'Make platform admin', danger: !u.is_platform_admin,
      body: u.is_platform_admin
        ? <>They will no longer be able to open this console.</>
        : <>They will see and change every organisation and every user on the platform, as you can.</>,
      run: () => act('admin', () => platform.updateUser(u.id, { is_platform_admin: !u.is_platform_admin }), u.is_platform_admin ? 'Console access removed.' : `${u.name} is now a platform admin.`),
    },
  }
  const c = confirm && confirms[confirm]

  return (
    <>
      <PageHeader
        back={<BackLink to="/users">Users</BackLink>}
        title={u.name}
        subtitle={<span className="flex flex-wrap items-center gap-2">{u.email}<Status user={u} /></span>}
        actions={<>
          <Button variant="outline" icon={RiKey2Line} loading={busy === 'password'} onClick={() => act('password', () => platform.sendPasswordLink(u.id), (r) => r.message)}>
            {u.email_verified ? 'Send password reset' : 'Resend invitation'}
          </Button>
          {u.locked && <Button icon={RiLockUnlockLine} loading={busy === 'unlock'} onClick={() => act('unlock', () => platform.unlockUser(u.id), `${u.name} can sign in again.`)}>Unlock</Button>}
          {!isMe && (u.is_active
            ? <Button variant="outline" icon={RiUserForbidLine} onClick={() => setConfirm('off')}>Switch off</Button>
            : <Button icon={RiUserFollowLine} loading={busy === 'on'} onClick={() => act('on', () => platform.updateUser(u.id, { is_active: true }), `${u.name} is switched on.`)}>Switch on</Button>)}
        </>}
      />

      {u.locked && (
        <p className="mb-4 rounded-xl border border-[var(--c-bad)]/30 bg-[var(--c-bad-soft)] px-4 py-3 text-sm text-[var(--c-bad)]">
          Locked out after too many wrong passwords. It clears by itself after a few minutes, or unlock it now.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Sign-in" className="lg:col-span-2">
          <Details items={[
            ['Signed in to', u.tenant ? <Link to={`/organisations/${u.tenant.id}`} className="text-[var(--c-brand)] hover:underline">{u.tenant.name}</Link> : '—'],
            ['Role there', roleLabel(u.role)],
            ['Last signed in', u.last_sign_in_at ? `${timeAgo(u.last_sign_in_at)} · ${formatDateTime(u.last_sign_in_at)}` : 'Never'],
            ['Open sessions', u.sessions],
            ['Email verified', u.email_verified ? 'Yes' : 'Not yet: they haven’t accepted their invitation'],
            ['Password last changed', formatDate(u.password_changed_at)],
            ['Created', formatDate(u.created_at)],
          ]} />
        </Card>
        <Card title="Security">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold"><RiShieldUserLine size={16} />Platform admin</p>
                <p className="mt-0.5 text-xs text-[var(--c-muted)]">Can open this console.{isMe && ' You can’t remove your own access.'}</p>
              </div>
              <Toggle label="Platform admin" checked={u.is_platform_admin} disabled={isMe} onChange={() => setConfirm('admin')} />
            </div>
            <Button variant="outline" size="sm" icon={RiLogoutCircleRLine} disabled={u.sessions === 0} onClick={() => setConfirm('signout')} className="w-full">
              Sign out everywhere{u.sessions ? ` (${u.sessions})` : ''}
            </Button>
          </div>
        </Card>
      </div>

      <Card title="Organisations" className="mt-4" padded={false}>
        <Table
          rows={u.memberships.map((m) => ({ ...m, id: m.tenant_id }))}
          empty="Not in any organisation."
          columns={[
            { key: 'org', header: 'Organisation', render: (m) => <span className="flex items-center gap-2"><Link to={`/organisations/${m.tenant_id}`} className="font-medium hover:underline">{m.tenant_name}</Link>{m.is_current && <Badge tone="brand">Signed in here</Badge>}{!m.tenant_active && <Badge tone="bad">Org switched off</Badge>}</span> },
            { key: 'role', header: 'Role', render: (m) => <span className="flex items-center gap-2">{roleLabel(m.role)}{m.is_owner && <Badge>Owner</Badge>}</span> },
            { key: 'access', header: 'Access', render: (m) => (
              <Toggle
                label={`Access to ${m.tenant_name}`}
                checked={m.is_active}
                disabled={busy !== null}
                onChange={(on) => act(`access-${m.tenant_id}`, () => platform.updateMembership(u.id, m.tenant_id, { is_active: on }), on ? `Access to ${m.tenant_name} switched on.` : `Access to ${m.tenant_name} switched off.`)}
              />
            ) },
            { key: 'joined', header: 'Joined', render: (m) => formatDate(m.joined_at) },
            { key: 'actions', header: '', className: 'text-right', render: (m) => (
              <span className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => setRoleFor(m)}>Change role</Button>
                {!m.is_current && m.is_active && m.tenant_active && (
                  <Button variant="ghost" size="sm" loading={busy === `switch-${m.tenant_id}`} onClick={() => act(`switch-${m.tenant_id}`, () => platform.switchUserTenant(u.id, m.tenant_id), `${u.name} now signs in to ${m.tenant_name}.`)}>Move here</Button>
                )}
              </span>
            ) },
          ]}
        />
      </Card>

      {c && <Confirm title={c.title} confirmLabel={c.label} danger={c.danger} busy={busy !== null} onConfirm={c.run} onClose={() => setConfirm(null)}>{c.body}</Confirm>}
      {roleFor && (
        <RoleModal
          membership={roleFor}
          busy={busy === 'role'}
          onClose={() => setRoleFor(null)}
          onSave={(role) => act('role', () => platform.updateMembership(u.id, roleFor.tenant_id, { role }), `${u.name} is now ${roleLabel(role)} at ${roleFor.tenant_name}.`)}
        />
      )}
    </>
  )
}

function RoleModal({ membership, busy, onClose, onSave }) {
  const { data: roles, loading } = useResource(() => platform.getTenant(membership.tenant_id).then((t) => t.roles), [membership.tenant_id])
  const [role, setRole] = useState(membership.role)

  return (
    <Modal
      title={`Role at ${membership.tenant_name}`}
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={busy} disabled={loading || role === membership.role} onClick={() => onSave(role)}>Save role</Button></>}
    >
      {loading ? <Spinner /> : (
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          {(roles ?? []).map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
        </Select>
      )}
      <p className="mt-3 text-xs text-[var(--c-muted)]">The role decides what they can see and do in this organisation. It takes effect the next time they load a page.</p>
    </Modal>
  )
}
