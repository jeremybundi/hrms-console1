import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { renderPage } from '../test/render'
import ErrorBoundary from './ErrorBoundary'

let broken = true
function Page() {
  if (broken) throw new Error('boom')
  return <p>Fine now</p>
}

describe('ErrorBoundary', () => {
  it('shows a way out instead of a blank page, and recovers on retry', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    // jsdom reports the thrown error too, even though the boundary catches it.
    const quiet = (e) => e.preventDefault()
    window.addEventListener('error', quiet)
    renderPage(<ErrorBoundary><Page /></ErrorBoundary>)
    expect(screen.getByText('This page hit a problem.')).toBeTruthy()
    expect(screen.getByText('boom')).toBeTruthy()

    broken = false
    fireEvent.click(screen.getByText('Try again'))
    expect(screen.getByText('Fine now')).toBeTruthy()
    window.removeEventListener('error', quiet)
  })
})
