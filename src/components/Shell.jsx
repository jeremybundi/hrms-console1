import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { RiBuilding2Line, RiDashboardLine, RiFileList3Line, RiHeartPulseLine, RiHistoryLine, RiLogoutBoxRLine, RiMenuLine, RiTeamLine } from 'react-icons/ri'
import { useAuth } from '../auth/context'
import { useI18n } from '../i18n/context'
import { API_BASE_URL } from '../api/client'
import LanguageSwitch from './LanguageSwitch'
import ThemeToggle from './ThemeToggle'

const NAV = [
  { to: '/', label: 'Overview', icon: RiDashboardLine, end: true },
  { to: '/organisations', label: 'Organisations', icon: RiBuilding2Line },
  { to: '/users', label: 'Users', icon: RiTeamLine },
  { to: '/health', label: 'System health', icon: RiHeartPulseLine },
  { to: '/activity', label: 'Console activity', icon: RiHistoryLine },
  { to: '/audit', label: 'Audit logs', icon: RiFileList3Line },
]

// Which engine the console is pointed at, so nobody mistakes production for local.
const ENV = /\.test|127\.0\.0\.1|localhost/.test(API_BASE_URL) ? { label: 'Local', tone: 'bg-[var(--c-ok-soft)] text-[var(--c-ok)]' }
  : /staging/.test(API_BASE_URL) ? { label: 'Staging', tone: 'bg-[var(--c-warn-soft)] text-[var(--c-warn)]' }
    : { label: 'Production', tone: 'bg-[var(--c-bad-soft)] text-[var(--c-bad)]' }

export default function Shell() {
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--c-side-border)] bg-[var(--c-side)] text-[var(--c-side-text)] transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-center justify-center px-4 py-3">
            <img src="/hrmspay-logo.png" alt="HRMSPAY" className="logo-light h-14 w-auto" />
            <img src="/hrmspay-logo-dark.png" alt="HRMSPAY" className="logo-dark h-14 w-auto" />
          </div>
          <div className="mt-2.5 flex items-center justify-between px-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--c-side-strong)]">{t('Console')}</p>
            <span className={`rounded px-1.5 py-px text-[10px] font-bold uppercase tracking-wider ${ENV.tone}`}>{t(ENV.label)}</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-[var(--c-side-active)] text-[var(--c-side-strong)]' : 'hover:bg-[var(--c-side-hover)] hover:text-[var(--c-side-strong)]'}`}
            >
              <Icon size={18} />{t(label)}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 px-3 pb-3">
          <ThemeToggle />
          <LanguageSwitch />
        </div>
        <div className="border-t border-[var(--c-side-border)] px-5 py-4">
          <p className="truncate text-sm font-semibold text-[var(--c-side-strong)]">{user?.name}</p>
          <p className="truncate text-xs">{user?.email}</p>
          <button type="button" onClick={signOut} className="mt-3 flex items-center gap-2 text-xs font-semibold hover:text-[var(--c-side-strong)]">
            <RiLogoutBoxRLine size={15} />{t('Sign out')}
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 lg:hidden">
        <button type="button" aria-label={t('Menu')} onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-[var(--c-input)]"><RiMenuLine size={20} /></button>
        <img src="/hrmspay-icon.png" alt="" className="logo-light h-7 w-7" />
        <img src="/hrmspay-icon-dark.png" alt="" className="logo-dark h-7 w-7" />
        <p className="font-heading text-sm font-bold">HRMSPAY {t('Console')}</p>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
