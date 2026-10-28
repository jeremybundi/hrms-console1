import { useEffect, useState } from 'react'
import { RiCheckboxCircleFill, RiDeleteBinLine, RiErrorWarningFill, RiRefreshLine, RiReplyLine } from 'react-icons/ri'
import { forgetFailedJob, getHealth, retryFailedJob } from '../api/platform'
import { useResource } from '../lib/useResource'
import { formatDateTime, formatNumber, timeAgo } from '../lib/format'
import { useToast } from '../components/toast'
import { Badge, Button, Card, Confirm, Details, PageHeader, Spinner, Table } from '../components/ui'

const REFRESH_MS = 30_000

export default function HealthPage() {
  const toast = useToast()
  const { data: h, loading, error, reload } = useResource(getHealth, [])
  const [busy, setBusy] = useState(null)
  const [forget, setForget] = useState(null)

  // Keeps itself up to date while the page is open.
  useEffect(() => {
    const t = setInterval(() => reload({ quiet: true }), REFRESH_MS)
    return () => clearInterval(t)
  }, [reload])

  if (loading && !h) return <Spinner />
  if (error && !h) return <p className="text-sm text-[var(--c-bad)]">{error}</p>

  async function run(key, call, message) {
    setBusy(key)
    try {
      await call()
      toast.success(message)
      setForget(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(null)
    }
  }

  const failures24h = Object.values(h.integrations.failures_24h ?? {}).reduce((a, b) => a + Number(b), 0)
  const overdue = h.scheduler.filter((t) => t.overdue || !t.ok)
  const checks = [
    { label: 'Queue', ok: h.queue.failed === 0, text: h.queue.failed ? `${h.queue.failed} failed job${h.queue.failed === 1 ? '' : 's'}` : 'No failed jobs' },
    { label: 'Scheduler', ok: h.scheduler.length > 0 && overdue.length === 0, text: h.scheduler.length === 0 ? 'Hasn’t run yet' : overdue.length ? `${overdue.length} task${overdue.length === 1 ? '' : 's'} need a look` : 'All tasks on time' },
    { label: 'Integrations', ok: failures24h === 0, text: failures24h ? `${failures24h} failed call${failures24h === 1 ? '' : 's'} in 24h` : 'No failures in 24h' },
    { label: 'Signatures', ok: h.signatures.not_checked_2h === 0, text: h.signatures.not_checked_2h ? `${h.signatures.not_checked_2h} not checked in 2h` : `${h.signatures.waiting} waiting, all checked` },
  ]

  return (
    <>
      <PageHeader
        title="System health"
        subtitle={`Checked ${timeAgo(h.app.checked_at)}. Refreshes by itself every 30 seconds.`}
        actions={<Button variant="outline" icon={RiRefreshLine} loading={loading} onClick={() => reload()}>Refresh</Button>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
            {c.ok ? <RiCheckboxCircleFill size={26} className="shrink-0 text-[var(--c-ok)]" /> : <RiErrorWarningFill size={26} className="shrink-0 text-[var(--c-warn)]" />}
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--c-muted)]">{c.label}</p>
              <p className="truncate text-sm font-semibold">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <Card title={`Failed jobs (${formatNumber(h.queue.failed)})`} className="mt-4" padded={false}
        action={h.queue.pending !== null && <span className="text-xs text-[var(--c-muted)]">{formatNumber(h.queue.pending)} waiting in the queue</span>}>
        <Table
          rows={h.queue.recent_failed}
          empty="No failed jobs. Everything on the queue ran."
          columns={[
            { key: 'job', header: 'Job', render: (j) => <><p className="font-mono text-xs font-medium">{j.job.split('\\').pop()}</p><p className="text-xs text-[var(--c-muted)]">{j.queue}</p></> },
            { key: 'error', header: 'Error', render: (j) => <p className="max-w-md truncate text-xs text-[var(--c-bad)]" title={j.error}>{j.error}</p> },
            { key: 'failed_at', header: 'Failed', render: (j) => <span title={formatDateTime(j.failed_at)}>{timeAgo(j.failed_at)}</span> },
            { key: 'actions', header: '', className: 'text-right', render: (j) => (
              <span className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" icon={RiReplyLine} loading={busy === j.uuid} onClick={() => run(j.uuid, () => retryFailedJob(j.uuid), 'The job is back on the queue.')}>Retry</Button>
                <Button variant="ghost" size="sm" icon={RiDeleteBinLine} aria-label="Remove" onClick={() => setForget(j)} />
              </span>
            ) },
          ]}
        />
      </Card>

      <Card title="Scheduled tasks" className="mt-4" padded={false}>
        <Table
          rows={h.scheduler.map((t) => ({ ...t, id: t.task }))}
          empty="No scheduled task has run yet. On the server, cron should run `php artisan schedule:run` every minute."
          columns={[
            { key: 'task', header: 'Task', render: (t) => <span className="font-mono text-xs">{t.task}</span> },
            { key: 'expression', header: 'Runs', render: (t) => <span className="font-mono text-xs text-[var(--c-muted)]">{t.expression}</span> },
            { key: 'ran_at', header: 'Last ran', render: (t) => <span title={formatDateTime(t.ran_at)}>{timeAgo(t.ran_at)}{t.seconds !== null && <span className="text-xs text-[var(--c-muted)]"> · {t.seconds}s</span>}</span> },
            { key: 'next', header: 'Next', render: (t) => timeAgo(t.next_due_at) },
            { key: 'status', header: 'Status', render: (t) => (!t.ok ? <Badge tone="bad" >Failed</Badge> : t.overdue ? <Badge tone="warn">Missed runs</Badge> : <Badge tone="ok">On time</Badge>) },
          ]}
        />
        {h.scheduler.some((t) => t.error) && (
          <div className="space-y-1 border-t border-[var(--c-border)] px-5 py-3">
            {h.scheduler.filter((t) => t.error).map((t) => <p key={t.task} className="text-xs text-[var(--c-bad)]"><b className="font-mono">{t.task}</b>: {t.error}</p>)}
          </div>
        )}
      </Card>

      <Card title="Integration failures, last 24 hours" className="mt-4" padded={false}>
        <Table
          rows={h.integrations.recent_failures}
          empty="No integration call failed in the last 24 hours."
          columns={[
            { key: 'type', header: 'Integration', render: (l) => <Badge tone="brand">{l.integration_type === 'signature' ? 'DD-Sign' : l.integration_type.toUpperCase()}</Badge> },
            { key: 'tenant', header: 'Organisation', render: (l) => l.tenant_name ?? '—' },
            { key: 'call', header: 'Call', render: (l) => <p className="max-w-xs truncate font-mono text-xs" title={l.endpoint}>{l.method} {l.endpoint}</p> },
            { key: 'error', header: 'Error', render: (l) => <p className="max-w-sm truncate text-xs text-[var(--c-bad)]" title={l.error_message}>{l.http_status_code ? `${l.http_status_code} · ` : ''}{l.error_message ?? 'Failed'}</p> },
            { key: 'at', header: 'When', render: (l) => timeAgo(l.created_at) },
          ]}
        />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="DD-Sign connections" padded={false}>
          <Table
            rows={h.integrations.signatures}
            minWidth={420}
            empty="No organisation has connected DD-Sign."
            columns={[
              { key: 'tenant', header: 'Organisation', render: (s) => <><p className="font-medium">{s.tenant_name}</p><p className="max-w-[14rem] truncate font-mono text-[11px] text-[var(--c-muted)]">{s.base_url}</p></> },
              { key: 'status', header: 'Status', render: (s) => <Connection active={s.is_active} error={s.last_error_message} /> },
              { key: 'last', header: 'Last worked', render: (s) => timeAgo(s.last_success_at) },
            ]}
          />
        </Card>
        <Card title="ERP connections" padded={false}>
          <Table
            rows={h.integrations.erp}
            minWidth={420}
            empty="No organisation has connected an ERP."
            columns={[
              { key: 'tenant', header: 'Organisation', render: (e) => <><p className="font-medium">{e.tenant_name}</p><p className="text-xs text-[var(--c-muted)]">{e.label} · {e.erp_type}</p></> },
              { key: 'status', header: 'Status', render: (e) => <Connection active={e.status !== 'inactive'} error={e.last_error_message} failures={e.consecutive_failures} /> },
              { key: 'last', header: 'Last worked', render: (e) => timeAgo(e.last_success_at) },
            ]}
          />
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Signatures">
          <Details items={[
            ['Waiting for a signature', formatNumber(h.signatures.waiting)],
            ['Not checked in 2 hours', h.signatures.not_checked_2h ? <span className="text-[var(--c-warn)]">{formatNumber(h.signatures.not_checked_2h)}: is the hourly check running?</span> : '0'],
            ['Signed, copy not saved yet', formatNumber(h.signatures.signed_without_copy)],
          ]} />
        </Card>
        <Card title="Server">
          <Details items={[
            ['Environment', <span className="flex items-center gap-2">{h.app.environment}{h.app.debug && <Badge tone="warn">Debug on</Badge>}</span>],
            ['PHP / Laravel', `${h.app.php} / ${h.app.laravel}`],
            ['Database', h.app.database],
            ['Queue / Cache', `${h.app.queue} / ${h.app.cache}`],
            ['Time zone', h.app.timezone],
          ]} />
        </Card>
      </div>

      {forget && (
        <Confirm title="Remove this failed job?" danger confirmLabel="Remove" busy={busy === 'forget'} onClose={() => setForget(null)}
          onConfirm={() => run('forget', () => forgetFailedJob(forget.uuid), 'The failed job was removed.')}>
          {forget.job.split('\\').pop()} won’t be retried. Use Retry instead if it should still run.
        </Confirm>
      )}
    </>
  )
}

function Connection({ active, error, failures }) {
  if (!active) return <Badge>Off</Badge>
  if (error) return <span title={error}><Badge tone="bad">Failing{failures ? ` ×${failures}` : ''}</Badge></span>
  return <Badge tone="ok">Working</Badge>
}
