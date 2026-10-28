import { Link, useNavigate } from 'react-router-dom'
import { RiBuilding2Line, RiFileShieldLine, RiMoneyDollarCircleLine, RiTeamLine, RiUserStarLine } from 'react-icons/ri'
import { getOverview } from '../api/platform'
import { useResource } from '../lib/useResource'
import { formatNumber } from '../lib/format'
import { Badge, Card, PageHeader, Spinner, Stat, Table } from '../components/ui'

export default function OverviewPage() {
  const navigate = useNavigate()
  const { data, loading, error } = useResource(getOverview, [])

  if (loading) return <Spinner />
  if (error) return <p className="text-sm text-[var(--c-bad)]">{error}</p>

  const { organisations: o, users: u, employees: e, payroll: p, documents: d } = data
  const peak = Math.max(1, ...data.signups.map((s) => s.count))

  return (
    <>
      <PageHeader title="Overview" subtitle="Everything on the platform, across every organisation." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Organisations" icon={RiBuilding2Line} value={formatNumber(o.total)} hint={`${formatNumber(o.active)} active · ${formatNumber(o.new_this_month)} new this month`} />
        <Stat label="Users" icon={RiUserStarLine} value={formatNumber(u.total)} hint={`${formatNumber(u.active)} active · ${formatNumber(u.unverified)} not yet verified`} />
        <Stat label="Employees" icon={RiTeamLine} tone="ok" value={formatNumber(e.active)} hint={`${formatNumber(e.joined_this_month)} added this month`} />
        <Stat label="Payroll this month" icon={RiMoneyDollarCircleLine} tone={p.failed_this_month ? 'bad' : 'ok'} value={formatNumber(p.runs_this_month)} hint={`${formatNumber(p.approved_this_month)} approved${p.failed_this_month ? ` · ${p.failed_this_month} failed` : ''}`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="New organisations, last 6 months" className="lg:col-span-2">
          <div className="flex h-44 items-end gap-3">
            {data.signups.map((s) => (
              <div key={s.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold tabular-nums">{s.count}</span>
                <div className="w-full max-w-14 rounded-t-md bg-[var(--c-brand)]" style={{ height: `${Math.max(4, (s.count / peak) * 120)}px`, opacity: s.count ? 1 : 0.25 }} />
                <span className="text-xs text-[var(--c-muted)]">{s.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Document signatures">
          <div className="space-y-4">
            <Row icon={RiFileShieldLine} label="Signed this month" value={formatNumber(d.signed_this_month)} />
            <Row icon={RiFileShieldLine} label="Waiting for a signature" value={formatNumber(d.waiting_signature)} />
            <Row icon={RiUserStarLine} label="Platform admins" value={formatNumber(u.platform_admins)} />
          </div>
          <Link to="/health" className="mt-5 inline-block text-xs font-semibold text-[var(--c-brand)]">See system health →</Link>
        </Card>
      </div>

      <Card title="Largest organisations" className="mt-4" padded={false} action={<Link to="/organisations" className="text-xs font-semibold text-[var(--c-brand)]">All organisations →</Link>}>
        <Table
          rows={data.largest}
          onRowClick={(t) => navigate(`/organisations/${t.id}`)}
          empty="No organisations yet."
          columns={[
            { key: 'name', header: 'Organisation', render: (t) => <span className="font-medium">{t.name}</span> },
            { key: 'employees_count', header: 'Active employees', render: (t) => formatNumber(t.employees_count) },
            { key: 'is_active', header: 'Status', render: (t) => (t.is_active ? <Badge tone="ok">Active</Badge> : <Badge tone="bad">Switched off</Badge>) },
          ]}
        />
      </Card>
    </>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--c-input)] text-[var(--c-muted)]"><Icon size={16} /></span>
      <span className="flex-1 text-sm text-[var(--c-muted)]">{label}</span>
      <span className="font-heading text-lg font-bold tabular-nums">{value}</span>
    </div>
  )
}
