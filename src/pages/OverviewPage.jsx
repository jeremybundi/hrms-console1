import { Link, useNavigate } from 'react-router-dom'
import {
  RiAlarmWarningLine, RiBuilding2Line, RiDeleteBinLine, RiFileTextLine,
  RiLoginBoxLine, RiMoneyDollarCircleLine, RiPulseLine, RiTeamLine, RiUserStarLine,
} from 'react-icons/ri'
import { getOverview } from '../api/platform'
import { useI18n } from '../i18n/context'
import { useResource } from '../lib/useResource'
import { dayLabel, formatNumber, monthLabel } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import { Card, PageHeader, Spinner, Stat, Table } from '../components/ui'

export default function OverviewPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { data, loading, error } = useResource(getOverview, [])

  if (loading) return <Spinner />
  if (error) return <p className="text-sm text-[var(--c-bad)]">{error}</p>

  const { organisations: o, users: u, employees: e, payroll: p, documents: d, sign_ins: s, workload: w, adoption: a } = data

  return (
    <>
      <PageHeader title={t('Overview')} subtitle={t('Everything on the platform, across every organisation.')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t('Organisations')} to="/organisations" icon={RiBuilding2Line} value={formatNumber(o.total)} hint={t('{active} active · {paused} paused · {new} new this month', { active: formatNumber(o.active), paused: formatNumber(o.paused), new: formatNumber(o.new_this_month) })} />
        <Stat label={t('Users')} to="/users" icon={RiUserStarLine} value={formatNumber(u.total)} hint={t('{active} active · {paused} paused · {unverified} not verified', { active: formatNumber(u.active), paused: formatNumber(u.paused), unverified: formatNumber(u.unverified) })} />
        <Stat label={t('Employees')} to="/organisations" icon={RiTeamLine} tone="ok" value={formatNumber(e.active)} hint={t('{count} added this month', { count: formatNumber(e.joined_this_month) })} />
        <Stat label={t('Payroll this month')} to="/organisations" icon={RiMoneyDollarCircleLine} tone={p.failed_this_month ? 'bad' : 'ok'} value={formatNumber(p.runs_this_month)} hint={t('{approved} approved · {paid} people paid', { approved: formatNumber(p.approved_this_month), paid: formatNumber(p.employees_paid_this_month) }) + (p.failed_this_month ? ` · ${t('{count} failed', { count: p.failed_this_month })}` : '')} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t('Sign-ins today')} to="/audit?category=sign_in&action=signed_in" icon={RiLoginBoxLine} value={formatNumber(s.today)} hint={t('{count} in the last 7 days', { count: formatNumber(s.last_7_days) })} />
        <Stat label={t('Active sessions')} to="/audit?category=sign_in" icon={RiPulseLine} value={formatNumber(s.active_sessions)} hint={t('Used in the last 24 hours')} />
        <Stat label={t('Failed sign-ins')} to="/audit?category=sign_in&action=sign_in_failed" icon={RiAlarmWarningLine} tone={s.failed_24h ? 'warn' : 'ok'} value={formatNumber(s.failed_24h)} hint={t('Last 24 hours · {count} locked out', { count: formatNumber(s.locked_out_24h) })} />
        <Stat label={t('Documents this month')} to="/organisations" icon={RiFileTextLine} value={formatNumber(w.documents_this_month)} hint={t('{signed} signed · {waiting} waiting for a signature', { signed: formatNumber(d.signed_this_month), waiting: formatNumber(d.waiting_signature) })} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t('Sign-ins, last 14 days')}>
          <Bars rows={s.daily.map((r) => ({ key: r.date, label: dayLabel(r.date), value: r.count }))} height={140} />
        </Card>
        <Card title={t('Growth, last 6 months')} action={<Legend t={t} />}>
          <Grouped rows={data.growth.map((g) => ({ key: g.month, label: monthLabel(g.month), values: [g.organisations, g.users, g.employees] }))} />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title={t('Largest organisations')} className="lg:col-span-2" padded={false} action={<Link to="/organisations" className="text-xs font-semibold text-[var(--c-brand)]">{t('All organisations')} →</Link>}>
          <Table
            rows={data.largest}
            onRowClick={(r) => navigate(`/organisations/${r.id}`)}
            empty={t('No organisations yet.')}
            minWidth={420}
            columns={[
              { key: 'name', header: t('Organisation'), render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'employees_count', header: t('Active employees'), render: (r) => formatNumber(r.employees_count) },
              { key: 'is_active', header: t('Status'), render: (r) => <StatusBadge status={r.is_active ? 'active' : 'paused'} /> },
            ]}
          />
        </Card>
        <Card title={t('What organisations use')}>
          <div className="space-y-4">
            <Share label="DD-Sign" count={a.dd_sign} total={o.total} />
            <Share label="ERP" count={a.erp} total={o.total} />
            {a.storage.map((st) => <Share key={st.driver} label={`${t('Storage')}: ${st.driver}`} count={st.count} total={o.total} />)}
            <Row icon={RiUserStarLine} label={t('Platform admins')} value={formatNumber(u.platform_admins)} />
            {(o.deleted > 0 || u.deleted > 0) && <Row icon={RiDeleteBinLine} label={t('Deleted, still restorable')} value={`${formatNumber(o.deleted)} · ${formatNumber(u.deleted)}`} />}
          </div>
          <Link to="/health" className="mt-5 inline-block text-xs font-semibold text-[var(--c-brand)]">{t('See system health')} →</Link>
        </Card>
      </div>
    </>
  )
}

/** One bar per row, scaled to the largest. */
function Bars({ rows, height = 120 }) {
  const peak = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="flex items-end gap-1.5 sm:gap-2.5" style={{ height: height + 40 }}>
      {rows.map((r) => (
        <div key={r.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" title={`${r.label}: ${r.value}`}>
          <span className="text-[10px] font-semibold tabular-nums text-[var(--c-muted)]">{r.value || ''}</span>
          <div className="w-full max-w-12 rounded-t-md bg-[var(--c-brand)]" style={{ height: Math.max(3, (r.value / peak) * height), opacity: r.value ? 1 : 0.2 }} />
          <span className="w-full truncate text-center text-[10px] text-[var(--c-muted)]">{r.label}</span>
        </div>
      ))}
    </div>
  )
}

const SERIES = ['var(--c-brand)', 'var(--c-accent)', '#f59e0b']

/** Three bars per month: organisations, users, employees. */
function Grouped({ rows }) {
  const peak = Math.max(1, ...rows.flatMap((r) => r.values))
  return (
    <div className="flex h-44 items-end gap-3">
      {rows.map((r) => (
        <div key={r.key} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-36 w-full items-end justify-center gap-1">
            {r.values.map((v, i) => (
              <div key={i} title={String(v)} className="w-full max-w-4 rounded-t" style={{ height: Math.max(3, (v / peak) * 136), background: SERIES[i], opacity: v ? 1 : 0.25 }} />
            ))}
          </div>
          <span className="text-xs text-[var(--c-muted)]">{r.label}</span>
        </div>
      ))}
    </div>
  )
}

function Legend({ t }) {
  return (
    <span className="flex flex-wrap gap-3 text-[11px] text-[var(--c-muted)]">
      {[t('Organisations'), t('Users'), t('Employees')].map((label, i) => (
        <span key={label} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: SERIES[i] }} />{label}</span>
      ))}
    </span>
  )
}

function Share({ label, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-sm"><span className="text-[var(--c-muted)]">{label}</span><span className="font-semibold tabular-nums">{count} / {total}</span></div>
      <div className="mt-1.5 h-1.5 rounded-full bg-[var(--c-input)]"><div className="h-full rounded-full bg-[var(--c-brand)]" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--c-input)] text-[var(--c-muted)]"><Icon size={16} /></span>
      <span className="flex-1 text-sm text-[var(--c-muted)]">{label}</span>
      <span className="font-heading text-lg font-bold tabular-nums">{value}</span>
    </div>
  )
}
