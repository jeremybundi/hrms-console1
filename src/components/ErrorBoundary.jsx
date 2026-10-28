import { Component } from 'react'
import { RiErrorWarningLine } from 'react-icons/ri'
import { useI18n } from '../i18n/context'
import { Button } from './ui'

/** Catches a page that crashes while rendering, so the rest of the console keeps working. Give it a `key` to reset it. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  render() {
    return this.state.error ? <Crashed error={this.state.error} onRetry={() => this.setState({ error: null })} /> : this.props.children
  }
}

function Crashed({ error, onRetry }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-6 py-16 text-center">
      <RiErrorWarningLine size={32} className="text-[var(--c-bad)]" />
      <p className="font-heading text-lg font-bold">{t('This page hit a problem.')}</p>
      <p className="max-w-md text-sm text-[var(--c-muted)]">{t('The rest of the console still works. Try again, or reload if it keeps happening.')}</p>
      <p className="max-w-md break-words font-mono text-xs text-[var(--c-muted)]">{error.message}</p>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => window.location.reload()}>{t('Reload')}</Button>
        <Button onClick={onRetry}>{t('Try again')}</Button>
      </div>
    </div>
  )
}
