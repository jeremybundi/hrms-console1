/** What each logged action reads as, in English; the feed translates it. */
const LABELS = {
  'tenant.created': 'created the organisation',
  'tenant.updated': 'edited the organisation',
  'tenant.paused': 'paused the organisation',
  'tenant.resumed': 'resumed the organisation',
  'tenant.deleted': 'deleted the organisation',
  'tenant.restored': 'restored the organisation',
  'tenant.purged': 'removed the organisation for good',
  'user.paused': 'paused',
  'user.resumed': 'resumed',
  'user.deleted': 'deleted',
  'user.restored': 'restored',
  'user.erased': 'erased',
  'user.renamed': 'renamed',
  'user.platform_admin_granted': 'made a platform admin:',
  'user.platform_admin_revoked': 'removed console access from',
  'user.password_reset_sent': 'sent a password reset to',
  'user.invitation_resent': 'resent the invitation to',
  'user.unlocked': 'unlocked',
  'user.signed_out': 'signed out everywhere:',
  'user.membership_changed': 'changed organisation access for',
  'user.added_to_organisation': 'added to an organisation:',
  'user.moved': 'moved to another organisation:',
  'job.retried': 'retried',
  'job.removed': 'removed failed',
}

export const actionLabel = (action) => LABELS[action] ?? action.replace('.', ' ').replaceAll('_', ' ')

export const actionTone = (action) => (/deleted|purged|erased/.test(action) ? 'bad' : /paused|revoked|signed_out/.test(action) ? 'warn' : /restored|resumed|created|granted/.test(action) ? 'ok' : 'muted')

/** A short line of what changed, from the entry's details. */
export function detailLine(entry, t) {
  const d = entry.details ?? {}
  switch (entry.action) {
    case 'tenant.updated': return Object.keys(d.after ?? {}).map((k) => `${k}: ${d.before?.[k] ?? '—'} → ${d.after[k] ?? '—'}`).join(', ')
    case 'tenant.purged': return t('{employees} employees and {people} sign-ins removed', { employees: d.employees ?? 0, people: d.people_removed ?? 0 })
    case 'tenant.created': return d.owner ? t('Owner: {email}', { email: d.owner }) : ''
    case 'user.membership_changed': return [d.organisation, d.role && `${t('Role')}: ${d.role.before} → ${d.role.after}`, d.access && `${t('Access')}: ${t(d.access === 'on' ? 'on' : 'off')}`].filter(Boolean).join(' · ')
    case 'user.added_to_organisation': return [d.organisation, d.role && `${t('Role')}: ${d.role}`].filter(Boolean).join(' · ')
    case 'user.moved': return `${d.from ?? '—'} → ${d.to}`
    case 'user.renamed': return `${d.before} → ${d.after}`
    case 'user.signed_out': return t('{count} sessions ended', { count: d.sessions ?? 0 })
    case 'user.erased': return d.was ? t('Was {who}', { who: d.was }) : ''
    default: return ''
  }
}
