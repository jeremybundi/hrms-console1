import { describe, expect, it, vi } from 'vitest'
import { api, qs, setToken } from './client'

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

describe('api client', () => {
  it('builds a query string without empty values', () => {
    expect(qs({ search: 'acme', tenant_id: '', status: null, page: 2 })).toBe('?search=acme&page=2')
    expect(qs({})).toBe('')
  })

  it('sends the token and returns the JSON body', async () => {
    setToken('abc')
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { data: 1 }))
    await expect(api('/x')).resolves.toEqual({ data: 1 })
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer abc')
  })

  it('turns a 422 into field errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(422, { error: { message: 'Invalid', details: { email: ['Taken.'] } } }))
    await expect(api('/x', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 422, message: 'Invalid', fields: { email: 'Taken.' } })
  })

  it('signs the console out when the token is rejected', async () => {
    setToken('stale')
    const onSignedOut = vi.fn()
    window.addEventListener('console:signed-out', onSignedOut)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(401, { message: 'Unauthenticated.' }))
    await expect(api('/x')).rejects.toMatchObject({ status: 401 })
    expect(onSignedOut).toHaveBeenCalled()
    window.removeEventListener('console:signed-out', onSignedOut)
  })

  it('says plainly when the server can’t be reached or is too slow', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(api('/x')).rejects.toMatchObject({ status: 0, message: expect.stringContaining('Can’t reach the server') })
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new DOMException('timed out', 'TimeoutError'))
    await expect(api('/x')).rejects.toMatchObject({ message: expect.stringContaining('took too long') })
  })
})
