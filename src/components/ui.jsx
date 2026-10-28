import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/context'
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiLoader4Line } from 'react-icons/ri'

const BUTTON = {
  primary: 'bg-[var(--c-brand)] text-white hover:opacity-90',
  outline: 'border border-[var(--c-border)] bg-[var(--c-surface)] text-[var(--c-text)] hover:bg-[var(--c-input)]',
  ghost: 'text-[var(--c-muted)] hover:bg-[var(--c-input)] hover:text-[var(--c-text)]',
  danger: 'bg-[var(--c-bad)] text-white hover:opacity-90',
}

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, children, className = '', ...props }) {
  const sizing = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      {...props}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${BUTTON[variant]} ${className}`}
    >
      {loading ? <RiLoader4Line size={16} className="animate-spin" /> : Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

export function Card({ title, action, children, className = '', padded = true }) {
  return (
    <section className={`rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-[var(--c-border)] px-5 py-3.5">
          <h2 className="font-heading text-sm font-bold">{title}</h2>
          {action}
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

const TONE = {
  ok: 'bg-[var(--c-ok-soft)] text-[var(--c-ok)]',
  warn: 'bg-[var(--c-warn-soft)] text-[var(--c-warn)]',
  bad: 'bg-[var(--c-bad-soft)] text-[var(--c-bad)]',
  brand: 'bg-[var(--c-brand-soft)] text-[var(--c-brand)]',
  muted: 'bg-[var(--c-input)] text-[var(--c-muted)]',
}

export function Badge({ tone = 'muted', children }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE[tone]}`}>{children}</span>
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-semibold text-[var(--c-muted)]">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs text-[var(--c-bad)]">{error}</span> : hint && <span className="mt-1 block text-xs text-[var(--c-muted)]">{hint}</span>}
    </label>
  )
}

const CONTROL = 'h-10 w-full rounded-lg border border-[var(--c-border)] bg-[var(--c-input)] px-3 text-sm text-[var(--c-text)] outline-none transition focus:border-[var(--c-brand)] focus:ring-2 focus:ring-[var(--c-brand-soft)]'

export function Input({ label, error, hint, className = '', ...props }) {
  return <Field label={label} error={error} hint={hint}><input {...props} className={`${CONTROL} ${className}`} /></Field>
}

export function Textarea({ label, error, hint, className = '', ...props }) {
  return <Field label={label} error={error} hint={hint}><textarea rows={3} {...props} className={`${CONTROL} h-auto py-2 ${className}`} /></Field>
}

export function Select({ label, error, children, className = '', ...props }) {
  return <Field label={label} error={error}><select {...props} className={`${CONTROL} ${className}`}>{children}</select></Field>
}

export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? 'bg-[var(--c-brand)]' : 'bg-[var(--c-border)]'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function Modal({ title, onClose, footer, children, width = 'max-w-lg' }) {
  const { t } = useI18n()
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-[8vh]" onMouseDown={onClose}>
      <div role="dialog" aria-label={title} className={`w-full ${width} rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-2xl`} onMouseDown={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-[var(--c-border)] px-5 py-4">
          <h2 className="font-heading text-base font-bold">{title}</h2>
          <button type="button" aria-label={t('Close')} onClick={onClose} className="rounded-lg p-1 text-[var(--c-muted)] hover:bg-[var(--c-input)]"><RiCloseLine size={20} /></button>
        </header>
        <div className="px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-[var(--c-border)] px-5 py-3">{footer}</footer>}
      </div>
    </div>
  )
}

/** Asks before something that's hard to undo. */
export function Confirm({ title, children, confirmLabel, danger, busy, onConfirm, onClose }) {
  const { t } = useI18n()
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>{t('Cancel')}</Button><Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={onConfirm}>{confirmLabel ?? t('Confirm')}</Button></>}
    >
      <div className="text-sm leading-relaxed text-[var(--c-muted)]">{children}</div>
    </Modal>
  )
}

/**
 * columns: [{ key, header, render?(row), className? }]. Narrower than `minWidth` it scrolls sideways.
 */
export function Table({ columns, rows, loading, error, empty, onRowClick, minWidth = 640 }) {
  const { t } = useI18n()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-[var(--c-border)] text-[11px] uppercase tracking-wider text-[var(--c-muted)]">
            {columns.map((c) => <th key={c.key} className={`px-5 py-3 font-semibold ${c.className ?? ''}`}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id ?? row.uuid ?? i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-[var(--c-border)] last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-[var(--c-input)]/60' : ''}`}
            >
              {columns.map((c) => <td key={c.key} className={`px-5 py-3 align-middle ${c.className ?? ''}`}>{c.render ? c.render(row) : row[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {loading && rows.length === 0 && <Spinner />}
      {error && <p className="px-5 py-6 text-sm text-[var(--c-bad)]">{error}</p>}
      {!loading && !error && rows.length === 0 && <p className="px-5 py-10 text-center text-sm text-[var(--c-muted)]">{empty ?? t('Nothing here yet.')}</p>}
    </div>
  )
}

export function Pagination({ meta, onPage }) {
  const { t } = useI18n()
  if (!meta || meta.last_page <= 1) return null
  return (
    <div className="flex items-center justify-between border-t border-[var(--c-border)] px-5 py-3 text-xs text-[var(--c-muted)]">
      <span>{t('Page {page} of {last} · {total} in all', { page: meta.current_page, last: meta.last_page, total: meta.total })}</span>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" icon={RiArrowLeftSLine} disabled={meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>{t('Previous')}</Button>
        <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>{t('Next')}<RiArrowRightSLine size={16} /></Button>
      </div>
    </div>
  )
}

/** A headline number. With `to`, the whole card links to where the number comes from. */
export function Stat({ label, value, hint, icon: Icon, tone = 'brand', to }) {
  const Box = to ? Link : 'div'
  return (
    <Box to={to} className={`block rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 ${to ? 'transition hover:border-[var(--c-brand)] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-brand-soft)]' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--c-muted)]">{label}</p>
        {Icon && <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONE[tone]}`}><Icon size={17} /></span>}
      </div>
      <p className="mt-2 font-heading text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--c-muted)]">{hint}</p>}
    </Box>
  )
}

export function Spinner({ label }) {
  const { t } = useI18n()
  return <p className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--c-muted)]"><RiLoader4Line size={18} className="animate-spin" />{label ?? t('Loading…')}</p>
}

export function PageHeader({ title, subtitle, actions, back }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back}
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--c-muted)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

/** Label / value pairs for a details panel. */
export function Details({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.filter(Boolean).map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-semibold text-[var(--c-muted)]">{label}</dt>
          <dd className="mt-0.5 break-words text-sm">{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
