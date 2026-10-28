import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import I18nProvider from '../i18n/I18nProvider'
import ToastProvider from '../components/ToastProvider'

/** Renders inside the router, language and toast providers the console's pages expect. */
export function renderPage(ui, { url = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <I18nProvider>
        <ToastProvider>{ui}</ToastProvider>
      </I18nProvider>
    </MemoryRouter>,
  )
}
