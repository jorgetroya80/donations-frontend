import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('renders icon, message, and CTA when all props provided', () => {
    const handleClick = vi.fn()
    render(
      <EmptyState
        icon={<span data-testid="icon" />}
        message="No items"
        cta={{ label: 'Create', onClick: handleClick }}
      />
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('renders without CTA when prop is omitted', () => {
    render(<EmptyState icon={<span />} message="No items" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onClick when CTA button is clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(
      <EmptyState
        icon={<span />}
        message="No items"
        cta={{ label: 'Create', onClick: handleClick }}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Create' }))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
