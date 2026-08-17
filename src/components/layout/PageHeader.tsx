import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeftIcon } from 'lucide-react'

// Every screen answers the same two questions in the same place: what am I
// looking at, and what is it for. Each page used to render a bare
// `<h1 className="text-xl font-semibold">` and nothing else, so a title
// like "Database" or "Config" had to carry the whole explanation on its
// own. The description line is not decoration — it is the only thing on
// these pages that says what the screen does.
interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
  backTo?: { label: string; to: string }
}

export function PageHeader({ title, description, actions, backTo }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4">
      {backTo && (
        <Link
          to={backTo.to}
          className="-ml-1 inline-flex w-fit items-center gap-0.5 rounded-md py-0.5 pr-2 pl-1 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronLeftIcon className="size-4" />
          {backTo.label}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-heading text-2xl leading-tight font-semibold tracking-tight text-balance">
            {title}
          </h1>
          {description && (
            <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {/* Wraps rather than shrinking: on a narrow screen a long primary
            action ("Add appointment slot") plus its siblings is wider than
            the column, and `shrink-0` would push it off the page instead. */}
        {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
