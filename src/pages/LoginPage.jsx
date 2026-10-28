import { useState } from 'react'
import { RiShieldKeyholeLine } from 'react-icons/ri'
import { useAuth } from '../auth/context'
import { Button, Input } from '../components/ui'

export default function LoginPage() {
  const { signIn } = useAuth()
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
      setError(err.message || 'Could not sign in.')
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--c-side)] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-white/10 bg-[var(--c-surface)] p-7 shadow-2xl">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--c-brand-soft)] text-[var(--c-brand)]"><RiShieldKeyholeLine size={22} /></span>
        <h1 className="mt-4 font-heading text-xl font-bold">HRMS Console</h1>
        <p className="mt-1 text-sm text-[var(--c-muted)]">Run every organisation on the platform. Platform admins only.</p>
        <div className="mt-6 space-y-4">
          <Input label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="mt-4 rounded-lg bg-[var(--c-bad-soft)] px-3 py-2 text-sm text-[var(--c-bad)]">{error}</p>}
        <Button type="submit" loading={busy} className="mt-6 w-full">Sign in</Button>
      </form>
    </div>
  )
}
