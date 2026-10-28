/** Actions that are hard or impossible to undo, kept apart and in red. */
export function DangerZone({ title = 'Danger zone', children }) {
  return (
    <section className="rounded-2xl border border-[var(--c-bad)]/40 bg-[var(--c-surface)]">
      <header className="border-b border-[var(--c-bad)]/30 px-5 py-3.5"><h2 className="font-heading text-sm font-bold text-[var(--c-bad)]">{title}</h2></header>
      <div className="divide-y divide-[var(--c-border)]">{children}</div>
    </section>
  )
}

export function DangerRow({ title, text, button }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-4">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-[var(--c-muted)]">{text}</p>
      </div>
      {button}
    </div>
  )
}
