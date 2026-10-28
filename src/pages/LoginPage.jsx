import { useState } from 'react'
import { useAuth } from '../auth/context'
import { useI18n } from '../i18n/context'
import { Button, Input } from '../components/ui'
import LanguageSwitch from '../components/LanguageSwitch'
import ThemeToggle from '../components/ThemeToggle'

export default function LoginPage() {
  const { signIn, notice } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.notAdmin ? t('This sign-in can’t use the console. Ask a platform admin to give you access.') : err.message || t('Could not sign in.'))
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--c-bg)] px-4">
      <div className="absolute right-4 top-4 flex w-72 flex-col gap-2 [--c-side-hover:var(--c-input)] [--c-side:var(--c-surface)] [--c-side-strong:var(--c-text)] [--c-side-text:var(--c-muted)]">
        <ThemeToggle />
        <LanguageSwitch />
      </div>
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-7 shadow-xl">
        <div className="flex justify-center py-3">
          <img src="/hrmspay-logo.png" alt="HRMSPAY" className="logo-light h-16 w-auto" />
          <img src="/hrmspay-logo-dark.png" alt="HRMSPAY" className="logo-dark h-16 w-auto" />
        </div>
        <h1 className="mt-5 font-heading text-xl font-bold">{t('Console')}</h1>
        <p className="mt-1 text-sm text-[var(--c-muted)]">{t('Run every organisation on the platform. Platform admins only.')}</p>
        <div className="mt-6 space-y-4">
          <Input label={t('Email')} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label={t('Password')} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {notice === 'idle' && !error && <p className="mt-4 rounded-lg bg-[var(--c-input)] px-3 py-2 text-sm text-[var(--c-muted)]">{t('You were signed out after 30 minutes without activity.')}</p>}
        {error && <p className="mt-4 rounded-lg bg-[var(--c-bad-soft)] px-3 py-2 text-sm text-[var(--c-bad)]">{error}</p>}
        <Button type="submit" loading={busy} className="mt-6 w-full">{t('Sign in')}</Button>
      </form>
    </div>
  )
}
