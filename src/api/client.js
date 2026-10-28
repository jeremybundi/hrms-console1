export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

const TOKEN_KEY = 'hrms-console-token'
const TIMEOUT_MS = 30_000

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }

  /** Field errors from a 422, as { field: 'first message' }. */
  get fields() {
    const details = this.payload?.error?.details ?? {}
    return Object.fromEntries(Object.entries(details).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
  }
}

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* storage blocked: the session lasts until reload */ }
}

/** Calls hrm-engine with the console's token. A rejected token signs the console out. */
export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken()
  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch (err) {
    // No response at all: offline, the API is down or blocked (CORS), or it took too long.
    throw new ApiError(err.name === 'TimeoutError' ? 'The server took too long to answer. Try again.' : 'Can’t reach the server. Check your connection and try again.', 0, null)
  }

  const data = res.status !== 204 && (res.headers.get('content-type') ?? '').includes('application/json') ? await res.json() : null

  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new CustomEvent('console:signed-out'))
    throw new ApiError(data?.error?.message || data?.message || `Request failed (${res.status})`, res.status, data)
  }
  return data
}

/** Builds a query string, skipping empty values. */
export function qs(params = {}) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== '') sp.append(k, String(v))
  const s = sp.toString()
  return s ? `?${s}` : ''
}
