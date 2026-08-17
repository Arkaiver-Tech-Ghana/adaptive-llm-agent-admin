import type { ComponentType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// An empty screen is the one a new owner sees first, so it is the app's
// best chance to explain itself. The previous version of each of these was
// a single muted sentence ("No tables yet.") with no way forward from it.
interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>
  title: string
  description: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-heading text-base font-medium">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
