import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './context'
import { getToken, setToken } from '../api/client'
import * as platform from '../api/platform'

/** Signed out after this long with no clicks, typing or scrolling, in any tab. */
export const IDLE_MS = 30 * 60 * 1000
const ACTIVE_KEY = 'hrms-console-active-at'

const readActive = () => { try { return Number(localStorage.getItem(ACTIVE_KEY)) || Date.now() } catch { return Date.now() } }
const writeActive = (at) => { try { localStorage.setItem(ACTIVE_KEY, String(at)) } catch { /* storage blocked: this tab keeps its own clock */ } }

/** Keeps the platform admin signed in, checking on load that the stored token still works. */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(() => !getToken())
  // Why the console last signed out by itself, shown on the sign-in page.
  const [notice, setNotice] = useState('')

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

  const signOut = useCallback(async () => {
    await platform.signOut().catch(() => {})
    setToken(null)
    setUser(null)
  }, [])

  // Idle sign-out. Activity is shared through storage, so a busy tab keeps the others signed in.
  useEffect(() => {
    if (!user) return undefined
    let local = Date.now()
    writeActive(local)
    const onActivity = () => {
      const now = Date.now()
      if (now - local > 15_000) { local = now; writeActive(now) }
    }
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))
    const timer = setInterval(() => {
      if (Date.now() - Math.max(local, readActive()) >= IDLE_MS) {
        setNotice('idle')
        signOut()
      }
    }, 15_000)
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity))
      clearInterval(timer)
    }
  }, [user, signOut])

  const signIn = useCallback(async (email, password) => {
    const { token, user: u } = await platform.signIn(email, password)
    if (!u.is_platform_admin) {
      setToken(token)
      await platform.signOut().catch(() => {})
      setToken(null)
      throw Object.assign(new Error('This sign-in can’t use the console.'), { notAdmin: true })
    }
    setToken(token)
    setNotice('')
    setUser(u)
  }, [])

  const value = useMemo(() => ({ user, ready, notice, signIn, signOut }), [user, ready, notice, signIn, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
