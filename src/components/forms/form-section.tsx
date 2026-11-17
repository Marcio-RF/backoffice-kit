import { cn } from "@/lib/utils"

/** Settings-style section: title and help on the left, fields in a card on the right. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  const id = `section-${title.toLowerCase().replace(/\W+/g, "-")}`
  return (
    <section aria-labelledby={id} className={cn("grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-10", className)}>
      <div className="space-y-1">
        <h2 id={id} className="font-semibold">
          {title}
        </h2>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      <div className="rounded-xl border bg-card p-4 shadow-xs md:p-6">{children}</div>
    </section>
  )
}

/** Sticky footer for primary form actions. */
export function FormActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-2 flex items-center justify-end gap-2 border-t bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
      {children}
    </div>
  )
}
