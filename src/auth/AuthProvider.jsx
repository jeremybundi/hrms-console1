import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './context'
import { getToken, setToken } from '../api/client'
import * as platform from '../api/platform'

/** Keeps the platform admin signed in, checking on load that the stored token still works. */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(() => !getToken())

  useEffect(() => {
    if (!getToken()) return undefined
    let cancelled = false
    platform.me()
      .then((u) => { if (!cancelled) setUser(u.is_platform_admin ? u : null) })
      .catch(() => setToken(null))
      .finally(() => !cancelled && setReady(true))
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const onSignedOut = () => { setToken(null); setUser(null) }
    window.addEventListener('console:signed-out', onSignedOut)
    return () => window.removeEventListener('console:signed-out', onSignedOut)
  }, [])

  const signIn = useCallback(async (email, password) => {
    const { token, user: u } = await platform.signIn(email, password)
    if (!u.is_platform_admin) {
      setToken(token)
      await platform.signOut().catch(() => {})
      setToken(null)
      throw Object.assign(new Error('This sign-in can’t use the console.'), { notAdmin: true })
    }
    setToken(token)
    setUser(u)
  }, [])

  const signOut = useCallback(async () => {
    await platform.signOut().catch(() => {})
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
