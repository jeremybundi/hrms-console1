import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RiLockLine, RiSearchLine } from 'react-icons/ri'
import { listTenants, listUsers } from '../api/platform'
import { useResource } from '../lib/useResource'
import { useDebounced } from '../lib/useDebounced'
import { formatDate, roleLabel } from '../lib/format'
import { Badge, Card, Input, PageHeader, Pagination, Select, Table } from '../components/ui'

export default function UsersPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') ?? '')
  const tenantId = params.get('tenant_id') ?? ''
  const status = params.get('status') ?? ''
  const page = Number(params.get('page') ?? 1)
  const q = useDebounced(search)
  const { data, loading, error } = useResource(() => listUsers({ search: q, tenant_id: tenantId, status, page }), [q, tenantId, status, page])
  const { data: tenants } = useResource(() => listTenants({ per_page: 100, sort: 'name' }).then((r) => r.data), [])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <>
      <PageHeader title="Users" subtitle="Every sign-in on the platform. Open one to reset a password, unlock it, or change what they can do." />
      <Card padded={false}>
        <div className="flex flex-wrap gap-3 border-b border-[var(--c-border)] p-4">
          <div className="relative min-w-56 flex-1">
            <RiSearchLine size={16} className="pointer-events-none absolute left-3 top-3 text-[var(--c-muted)]" />
            <Input placeholder="Search by name or email" value={search} onChange={(e) => { setSearch(e.target.value); setParam('page', '') }} className="pl-9" />
          </div>
          <div className="w-56">
            <Select value={tenantId} onChange={(e) => setParam('tenant_id', e.target.value)}>
              <option value="">All organisations</option>
              {(tenants ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </div>
          <div className="w-44">
            <Select value={status} onChange={(e) => setParam('status', e.target.value)}>
              <option value="">Everyone</option>
              <option value="active">Active</option>
              <option value="inactive">Switched off</option>
              <option value="unverified">Not verified</option>
              <option value="platform_admin">Platform admins</option>
            </Select>
          </div>
        </div>
        <Table
          rows={data?.data ?? []}
          loading={loading}
          error={error}
          onRowClick={(u) => navigate(`/users/${u.id}`)}
          empty="No user matches."
          columns={[
            { key: 'name', header: 'User', render: (u) => <><p className="flex items-center gap-1.5 font-medium">{u.name}{u.locked && <RiLockLine size={14} title="Locked out" className="text-[var(--c-bad)]" />}</p><p className="text-xs text-[var(--c-muted)]">{u.email}</p></> },
            { key: 'tenant', header: 'Signed in to', render: (u) => <><p>{u.tenant?.name ?? '—'}</p>{u.organisations_count > 1 && <p className="text-xs text-[var(--c-muted)]">+{u.organisations_count - 1} more</p>}</> },
            { key: 'role', header: 'Role', render: (u) => roleLabel(u.role) },
            { key: 'status', header: 'Status', render: (u) => <Status user={u} /> },
            { key: 'created', header: 'Created', render: (u) => formatDate(u.created_at) },
          ]}
        />
        <Pagination meta={data?.meta} onPage={(p) => setParam('page', String(p))} />
      </Card>
    </>
  )
}

export function Status({ user }) {
  return (
    <span className="flex flex-wrap gap-1">
      {user.is_active ? <Badge tone="ok">Active</Badge> : <Badge tone="bad">Switched off</Badge>}
      {user.locked && <Badge tone="bad">Locked out</Badge>}
      {!user.email_verified && <Badge tone="warn">Not verified</Badge>}
      {user.is_platform_admin && <Badge tone="brand">Platform admin</Badge>}
    </span>
  )
}
