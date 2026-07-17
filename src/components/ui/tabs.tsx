import { cn } from '@/lib/utils'

interface TabListProps<T extends string> {
  tabs: { key: T; label: string }[]
  value: T
  onChange: (key: T) => void
  className?: string
}

export function TabList<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: TabListProps<T>) {
  function handleKeyDown(event: React.KeyboardEvent) {
    const index = tabs.findIndex((tab) => tab.key === value)
    let next: number | null = null
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (event.key === 'ArrowLeft')
      next = (index - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    if (next === null) return

    event.preventDefault()
    const key = tabs[next].key
    onChange(key)
    document.getElementById(`tab-${key}`)?.focus()
  }

  return (
    <div className={cn('border-b', className)}>
      <nav
        className="-mb-px flex gap-4"
        role="tablist"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={value === tab.key}
            aria-controls={`panel-${tab.key}`}
            tabIndex={value === tab.key ? 0 : -1}
            onClick={() => onChange(tab.key)}
            className={cn(
              'border-b-2 px-1 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              value === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
