import { cn } from "@/lib/utils"

// Every list in the app used to render a bare "Loading…" line, which
// reflows the whole page the moment data lands. These hold the shape.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
