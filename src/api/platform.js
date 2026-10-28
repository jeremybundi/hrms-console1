import { api, qs } from './client'

export const signIn = (email, password) => api('/auth/login', { method: 'POST', body: { email, password } })
export const signOut = () => api('/auth/logout', { method: 'POST' })
export const me = () => api('/auth/me').then((r) => r.user)

export const getOverview = () => api('/platform/overview').then((r) => r.data)
export const getHealth = () => api('/platform/health').then((r) => r.data)
export const retryFailedJob = (uuid) => api(`/platform/failed-jobs/${uuid}/retry`, { method: 'POST' })
export const forgetFailedJob = (uuid) => api(`/platform/failed-jobs/${uuid}`, { method: 'DELETE' })

export const listTenants = (params) => api(`/platform/tenants${qs(params)}`)
export const getTenant = (id) => api(`/platform/tenants/${id}`).then((r) => r.data)
export const createTenant = (body) => api('/platform/tenants', { method: 'POST', body }).then((r) => r.data)
export const updateTenant = (id, body) => api(`/platform/tenants/${id}`, { method: 'PATCH', body }).then((r) => r.data)

export const listUsers = (params) => api(`/platform/users${qs(params)}`)
export const getUser = (id) => api(`/platform/users/${id}`).then((r) => r.data)
export const updateUser = (id, body) => api(`/platform/users/${id}`, { method: 'PATCH', body }).then((r) => r.data)
export const sendPasswordLink = (id) => api(`/platform/users/${id}/password-link`, { method: 'POST' })
export const unlockUser = (id) => api(`/platform/users/${id}/unlock`, { method: 'POST' }).then((r) => r.data)
export const signOutUser = (id) => api(`/platform/users/${id}/sign-out`, { method: 'POST' })
export const switchUserTenant = (id, tenantId) => api(`/platform/users/${id}/switch`, { method: 'POST', body: { tenant_id: tenantId } }).then((r) => r.data)
export const updateMembership = (id, tenantId, body) => api(`/platform/users/${id}/memberships/${tenantId}`, { method: 'PATCH', body }).then((r) => r.data)
