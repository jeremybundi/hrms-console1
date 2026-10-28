import { useCallback, useEffect, useState } from 'react'

/**
 * Loads something and keeps it with its loading and error state. It loads again
 * when `deps` change; `reload()` fetches again without blanking what is shown.
 */
export function useResource(load, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [tick, setTick] = useState(0)
  const key = JSON.stringify(deps)

  useEffect(() => {
    let cancelled = false
    load()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((err) => !cancelled && setState((s) => ({ ...s, loading: false, error: err.message || 'Something went wrong.' })))
    return () => { cancelled = true }
    // `load` is a new function each render; `key` says when what it fetches has changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick])

  /** `reload({ quiet: true })` refreshes in the background, without showing it is loading. */
  const reload = useCallback(({ quiet = false } = {}) => {
    if (!quiet) setState((s) => ({ ...s, loading: true }))
    setTick((t) => t + 1)
  }, [])
  const setData = useCallback((data) => setState((s) => ({ ...s, data })), [])

  return { ...state, setData, reload }
}
