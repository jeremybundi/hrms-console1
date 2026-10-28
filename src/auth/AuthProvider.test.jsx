import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import * as platform from '../api/platform'
import { setToken } from '../api/client'
import AuthProvider, { IDLE_MS } from './AuthProvider'
import { useAuth } from './context'

vi.mock('../api/platform', () => ({
  me: vi.fn(async () => ({ id: 1, name: 'Ada', is_platform_admin: true })),
  signOut: vi.fn(async () => {}),
}))

function Who() {
  const { user, notice } = useAuth()
  return <p>{user ? `in:${user.name}` : `out:${notice}`}</p>
}

describe('idle sign-out', () => {
  it('signs out after 30 minutes without activity, and activity keeps the session going', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    setToken('t')
    render(<AuthProvider><Who /></AuthProvider>)
    expect(await screen.findByText('in:Ada')).toBeTruthy()

    await act(async () => { vi.advanceTimersByTime(IDLE_MS - 60_000) })
    window.dispatchEvent(new Event('keydown'))
    await act(async () => { vi.advanceTimersByTime(IDLE_MS - 60_000) })
    expect(screen.getByText('in:Ada')).toBeTruthy()

    await act(async () => { vi.advanceTimersByTime(60_000 + 15_000) })
    expect(await screen.findByText('out:idle')).toBeTruthy()
    expect(platform.signOut).toHaveBeenCalled()
    vi.useRealTimers()
  })
})
