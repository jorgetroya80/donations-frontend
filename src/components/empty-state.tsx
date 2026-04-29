import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: ReactNode
  message: string
  cta?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, message, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="text-muted-foreground opacity-50">{icon}</div>
      <p className="text-muted-foreground">{message}</p>
      {cta && <Button onClick={cta.onClick}>{cta.label}</Button>}
    </div>
  )
}
