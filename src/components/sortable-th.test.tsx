import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SortableTh } from './sortable-th'

function renderInTable(ui: ReactNode) {
  return render(
    <table>
      <thead>
        <tr>{ui}</tr>
      </thead>
    </table>
  )
}

describe('SortableTh', () => {
  it('calls onSort when the header button is clicked', async () => {
    const onSort = vi.fn()
    renderInTable(
      <SortableTh ariaSort="none" onSort={onSort} indicator="↕">
        Importe
      </SortableTh>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Importe' }))

    expect(onSort).toHaveBeenCalledOnce()
  })

  it('aligns left by default', () => {
    renderInTable(
      <SortableTh ariaSort="none" onSort={vi.fn()} indicator="↕">
        Fecha
      </SortableTh>
    )

    expect(screen.getByRole('columnheader')).toHaveClass('text-left')
    expect(screen.getByRole('button')).not.toHaveClass('ml-auto')
  })

  it('aligns label and indicator right when align is right', () => {
    renderInTable(
      <SortableTh
        ariaSort="ascending"
        onSort={vi.fn()}
        indicator="↑"
        align="right"
      >
        Importe
      </SortableTh>
    )

    const header = screen.getByRole('columnheader')
    expect(header).toHaveClass('text-right')
    expect(header).not.toHaveClass('text-left')
    expect(screen.getByRole('button')).toHaveClass('ml-auto', 'justify-end')
  })
})
