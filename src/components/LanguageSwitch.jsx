import { RiTranslate2 } from 'react-icons/ri'
import { LANGUAGES, useI18n } from '../i18n/context'

/** English or Kiswahili. Remembered in this browser. */
export default function LanguageSwitch({ className = '' }) {
  const { t, language, setLanguage } = useI18n()

  return (
    <label className={`flex items-center gap-2 rounded-lg bg-[var(--c-side-hover)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--c-side-text)] ${className}`}>
      <RiTranslate2 size={14} className="shrink-0" />
      <span className="sr-only">{t('Language')}</span>
      <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full cursor-pointer bg-transparent text-[var(--c-side-strong)] outline-none">
        {LANGUAGES.map((l) => <option key={l.code} value={l.code} className="text-black">{l.label}</option>)}
      </select>
    </label>
  )
}
