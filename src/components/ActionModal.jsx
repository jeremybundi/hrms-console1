import { useState } from 'react'
import { useI18n } from '../i18n/context'
import { Button, Input, Modal, Textarea } from './ui'

/**
 * Asks before a pause, delete, purge or erase. `reason` asks why (kept in the activity log);
 * `confirmText` makes the admin type something, such as the organisation's name, first.
 * `run` gets { reason, confirm } and rejects with the API's error to show it here.
 */
export default function ActionModal({ title, children, actionLabel, danger, reason, reasonPlaceholder, confirmText, confirmLabel, run, onClose }) {
  const { t } = useI18n()
  const [why, setWhy] = useState('')
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})

  const typedOk = !confirmText || typed.trim().toLowerCase() === confirmText.trim().toLowerCase()
  const ready = typedOk && (!reason || why.trim().length >= 3)

  async function submit(e) {
    e.preventDefault()
    if (!ready) return
    setBusy(true)
    setErrors({})
    try {
      await run({ reason: why.trim(), confirm: typed.trim() })
    } catch (err) {
      const fields = err.fields ?? {}
      setErrors(Object.keys(fields).length ? fields : { form: err.message })
      setBusy(false)
    }
  }

  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onClose}
      footer={<><Button variant="ghost" onClick={onClose} disabled={busy}>{t('Cancel')}</Button><Button type="submit" form="action-modal" variant={danger ? 'danger' : 'primary'} loading={busy} disabled={!ready}>{actionLabel}</Button></>}
    >
      <form id="action-modal" onSubmit={submit} className="space-y-4">
        <div className="text-sm leading-relaxed text-[var(--c-muted)]">{children}</div>
        {reason && (
          <Textarea label={t('Reason')} placeholder={reasonPlaceholder} value={why} onChange={(e) => setWhy(e.target.value)} error={errors.reason} hint={t('Kept in the activity log, and shown on the record.')} autoFocus={!confirmText} maxLength={500} />
        )}
        {confirmText && (
          <Input
            label={confirmLabel ?? <>{t('Type this to confirm:')} <b className="font-mono text-[var(--c-text)]">{confirmText}</b></>}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            error={errors.confirm}
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
        )}
        {errors.form && <p className="rounded-lg bg-[var(--c-bad-soft)] px-3 py-2 text-sm text-[var(--c-bad)]">{errors.form}</p>}
      </form>
    </Modal>
  )
}
