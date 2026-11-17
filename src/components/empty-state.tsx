import type { LucideIcon } from "lucide-react"

/** Empty state: icon, one-line title, what to do next, and the action that does it. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
      <div className="mb-4 flex size-10 items-center justify-center rounded-lg border bg-card shadow-xs">
        <Icon aria-hidden className="size-5 text-muted-foreground" />
      </div>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
