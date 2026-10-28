import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { RiBuilding2Line, RiDashboardLine, RiHeartPulseLine, RiLogoutBoxRLine, RiMenuLine, RiTeamLine } from 'react-icons/ri'
import { useAuth } from '../auth/context'
import { API_BASE_URL } from '../api/client'

const NAV = [
  { to: '/', label: 'Overview', icon: RiDashboardLine, end: true },
  { to: '/organisations', label: 'Organisations', icon: RiBuilding2Line },
  { to: '/users', label: 'Users', icon: RiTeamLine },
  { to: '/health', label: 'System health', icon: RiHeartPulseLine },
]

// Which engine the console is pointed at, so nobody mistakes production for local.
const ENV = /\.test|127\.0\.0\.1|localhost/.test(API_BASE_URL) ? { label: 'Local', tone: 'bg-emerald-500/15 text-emerald-300' }
  : /staging/.test(API_BASE_URL) ? { label: 'Staging', tone: 'bg-amber-500/15 text-amber-300' }
    : { label: 'Production', tone: 'bg-rose-500/15 text-rose-300' }

export default function Shell() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[var(--c-side)] text-[var(--c-side-text)] transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 px-5 py-5">
          <img src="/favicon.svg" alt="" className="h-9 w-9" />
          <div>
            <p className="font-heading text-sm font-bold text-white">HRMS Console</p>
            <span className={`mt-0.5 inline-block rounded px-1.5 py-px text-[10px] font-bold uppercase tracking-wider ${ENV.tone}`}>{ENV.label}</span>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-[var(--c-side-active)] text-white' : 'hover:bg-[var(--c-side-active)]/60 hover:text-white'}`}
            >
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-xs">{user?.email}</p>
          <button type="button" onClick={signOut} className="mt-3 flex items-center gap-2 text-xs font-semibold hover:text-white">
            <RiLogoutBoxRLine size={15} />Sign out
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 lg:hidden">
        <button type="button" aria-label="Menu" onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-[var(--c-input)]"><RiMenuLine size={20} /></button>
        <p className="font-heading text-sm font-bold">HRMS Console</p>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
