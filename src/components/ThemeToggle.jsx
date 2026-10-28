import { useState } from 'react'
import { RiComputerLine, RiMoonLine, RiSunLine } from 'react-icons/ri'
import { useI18n } from '../i18n/context'
import { applyTheme, storedTheme } from '../lib/theme'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: RiSunLine },
  { value: 'dark', label: 'Dark', icon: RiMoonLine },
  { value: 'system', label: 'System', icon: RiComputerLine },
]

/** Light, dark, or whatever the device uses. Remembered in this browser. */
export default function ThemeToggle({ className = '' }) {
  const { t } = useI18n()
  const [theme, setTheme] = useState(storedTheme)

  function choose(value) {
    applyTheme(value)
    setTheme(value)
  }

  return (
    <div role="radiogroup" aria-label={t('Theme')} className={`flex rounded-lg bg-[var(--c-side-hover)] p-0.5 ${className}`}>
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          title={t(label)}
          onClick={() => choose(value)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${theme === value ? 'bg-[var(--c-side)] text-[var(--c-side-strong)] shadow-sm' : 'text-[var(--c-side-text)] hover:text-[var(--c-side-strong)]'}`}
        >
          <Icon size={14} />{t(label)}
        </button>
      ))}
    </div>
  )
}
