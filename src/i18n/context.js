import { createContext, useContext } from 'react'

export const LANGUAGES = [
  { code: 'en', label: 'English', locale: 'en-GB' },
  { code: 'sw', label: 'Kiswahili', locale: 'sw-KE' },
]

/** English text in, the viewer's language out; `{name}` placeholders are filled from `params`. */
const english = (text, params) => fill(text, params)

export function fill(text, params) {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (_, key) => (params[key] ?? ''))
}

export const I18nContext = createContext({ t: english, language: 'en', setLanguage: () => {} })

/** const { t, language, setLanguage } = useI18n() */
export const useI18n = () => useContext(I18nContext)
