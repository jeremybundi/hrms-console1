import { useCallback, useMemo, useState } from 'react'
import { I18nContext, LANGUAGES, fill } from './context'
import { setFormatLocale } from '../lib/format'
import sw from './sw'

const KEY = 'hrms-console-language'
const DICTIONARIES = { sw }

function storedLanguage() {
  try {
    const code = localStorage.getItem(KEY)
    return LANGUAGES.some((l) => l.code === code) ? code : 'en'
  } catch {
    return 'en'
  }
}

function apply(code) {
  document.documentElement.lang = code
  setFormatLocale(LANGUAGES.find((l) => l.code === code)?.locale)
}

/** The console's language, remembered in this browser. Missing translations fall back to English. */
export default function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const code = storedLanguage()
    apply(code)
    return code
  })

  const setLanguage = useCallback((code) => {
    apply(code)
    try { localStorage.setItem(KEY, code) } catch { /* storage blocked: lasts until reload */ }
    setLanguageState(code)
  }, [])

  const t = useCallback((text, params) => fill(DICTIONARIES[language]?.[text] ?? text, params), [language])
  const value = useMemo(() => ({ t, language, setLanguage }), [t, language, setLanguage])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
