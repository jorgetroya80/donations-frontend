import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '@/components/error-boundary'
import { renderWithProviders } from '@/test/test-utils'

function Boom(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when no error occurs', () => {
    renderWithProviders(
      <ErrorBoundary>
        <p>contenido</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })

  it('renders fallback when a child throws', () => {
    renderWithProviders(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Recargar página' })
    ).toBeInTheDocument()
  })
})
