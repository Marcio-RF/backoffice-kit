import { cn } from "@/lib/utils"

export type Tone = "neutral" | "info" | "warning" | "success" | "danger"

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-foreground [--dot:var(--muted-foreground)]",
  info: "bg-info/10 text-info [--dot:var(--info)]",
  warning: "bg-warning/10 text-warning [--dot:var(--warning)]",
  success: "bg-success/10 text-success [--dot:var(--success)]",
  danger: "bg-destructive/10 text-destructive [--dot:var(--destructive)]",
}

/** Status pill: colour + dot + text, so meaning never depends on colour alone. */
export function StatusBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-(--dot)" />
      {children}
    </span>
  )
}
