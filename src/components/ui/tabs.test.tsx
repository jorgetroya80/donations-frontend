import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { TabList } from './tabs'

const items = [
  { key: 'one', label: 'Uno' },
  { key: 'two', label: 'Dos' },
  { key: 'three', label: 'Tres' },
]

function Harness() {
  const [value, setValue] = useState('one')
  return <TabList tabs={items} value={value} onChange={setValue} />
}

describe('TabList', () => {
  it('renders tabs with correct roles and roving tabindex', () => {
    render(<Harness />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAttribute('tabindex', '0')
    expect(tabs[1]).toHaveAttribute('tabindex', '-1')
  })

  it('moves selection and focus with arrow keys, Home and End', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    screen.getByRole('tab', { name: 'Uno' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Dos' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('tab', { name: 'Dos' })).toHaveFocus()

    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Tres' })).toHaveFocus()

    // Wraps around from the last tab
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Uno' })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Uno' })).toHaveFocus()
  })

  it('selects a tab on click', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('tab', { name: 'Tres' }))
    expect(screen.getByRole('tab', { name: 'Tres' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })
})
