import { useCallback, useMemo, useState } from 'react'
import { RiCheckboxCircleLine, RiErrorWarningLine } from 'react-icons/ri'
import { ToastContext } from './toast'

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((kind, message) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, kind, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  const value = useMemo(() => ({ success: (m) => push('success', m), error: (m) => push('error', m) }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(380px,calc(100vw-32px))] flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="flex items-start gap-2.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-3 text-sm shadow-lg">
            {t.kind === 'success'
              ? <RiCheckboxCircleLine size={18} className="mt-px shrink-0 text-[var(--c-ok)]" />
              : <RiErrorWarningLine size={18} className="mt-px shrink-0 text-[var(--c-bad)]" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
