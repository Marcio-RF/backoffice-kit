import { Skeleton } from "@/components/ui/skeleton"

/** Loading placeholder with the same footprint as DataTable, so the page doesn't jump. */
export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading table">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="h-9 border-b bg-muted/50" />
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex h-12 items-center gap-4 border-b px-3 last:border-0">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
