import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { FormEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Input } from './input'

describe('Input', () => {
  describe('type="password"', () => {
    it('renders toggle button with aria-label "Mostrar contraseña"', () => {
      render(<Input type="password" />)
      expect(
        screen.getByRole('button', { name: 'Mostrar contraseña' })
      ).toBeInTheDocument()
    })

    it('clicking toggle reveals password and updates aria-label', async () => {
      const user = userEvent.setup()
      render(<Input type="password" placeholder="pw" />)
      const input = screen.getByPlaceholderText('pw')

      await user.click(
        screen.getByRole('button', { name: 'Mostrar contraseña' })
      )

      expect(input).toHaveAttribute('type', 'text')
      expect(
        screen.getByRole('button', { name: 'Ocultar contraseña' })
      ).toBeInTheDocument()
    })

    it('toggle reports its state through aria-pressed', async () => {
      const user = userEvent.setup()
      render(<Input type="password" />)

      expect(
        screen.getByRole('button', { name: 'Mostrar contraseña' })
      ).toHaveAttribute('aria-pressed', 'false')

      await user.click(
        screen.getByRole('button', { name: 'Mostrar contraseña' })
      )

      expect(
        screen.getByRole('button', { name: 'Ocultar contraseña' })
      ).toHaveAttribute('aria-pressed', 'true')
    })

    it('clicking toggle twice masks password again', async () => {
      const user = userEvent.setup()
      render(<Input type="password" placeholder="pw" />)
      const input = screen.getByPlaceholderText('pw')

      await user.click(
        screen.getByRole('button', { name: 'Mostrar contraseña' })
      )
      await user.click(
        screen.getByRole('button', { name: 'Ocultar contraseña' })
      )

      expect(input).toHaveAttribute('type', 'password')
      expect(
        screen.getByRole('button', { name: 'Mostrar contraseña' })
      ).toBeInTheDocument()
    })

    it('toggling inside a form does not submit it', async () => {
      const user = userEvent.setup()
      const onSubmit = vi.fn((e: FormEvent) => e.preventDefault())
      render(
        <form onSubmit={onSubmit}>
          <Input type="password" />
        </form>
      )

      await user.click(
        screen.getByRole('button', { name: 'Mostrar contraseña' })
      )

      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('non-password type', () => {
    it('renders no toggle button', () => {
      render(<Input type="text" />)
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })
})
