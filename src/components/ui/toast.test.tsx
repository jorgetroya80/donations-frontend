import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/test-utils'
import { useToast } from './toast'

function AddToastButton() {
  const toast = useToast()
  return (
    <button
      type="button"
      onClick={() => toast.add({ title: 'Guardado correctamente' })}
    >
      Lanzar
    </button>
  )
}

describe('Toast', () => {
  it('shows a toast when added and dismisses it via the close button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AddToastButton />)

    await user.click(screen.getByRole('button', { name: 'Lanzar' }))

    expect(
      await screen.findByText('Guardado correctamente')
    ).toBeInTheDocument()

    // base-ui keeps toast buttons out of the a11y tree until the viewport
    // is focused, so the close button is not reachable via role queries
    const closeButton = document.querySelector('button[aria-label="Cerrar"]')
    expect(closeButton).not.toBeNull()
    fireEvent.click(closeButton as HTMLElement)

    await waitFor(() => {
      expect(
        screen.queryByText('Guardado correctamente')
      ).not.toBeInTheDocument()
    })
  })
})
