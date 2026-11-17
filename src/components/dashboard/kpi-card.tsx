import { ArrowDownRight, ArrowUpRight } from "lucide-react"

import { Sparkline } from "@/components/dashboard/sparkline"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * KPI tile: label, hero number, delta with arrow + sign + text (never colour alone),
 * optional sparkline. `invert` marks metrics where going down is good.
 */
export function KpiCard({
  label,
  value,
  delta,
  hint,
  series,
  invert = false,
}: {
  label: string
  value: string
  delta: number
  hint: string
  series?: readonly number[] | null
  invert?: boolean
}) {
  const up = delta >= 0
  const good = invert ? !up : up
  const Arrow = up ? ArrowUpRight : ArrowDownRight

  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {series ? (
          <CardAction>
            <Sparkline data={series} label={`${label} trend, last 30 days`} width={80} height={24} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-1.5 px-4">
        <div data-slot="kpi-value" className="text-2xl font-semibold tracking-tight">
          {value}
        </div>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1 font-medium tabular-nums",
              good ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            <Arrow aria-hidden className="size-3.5" />
            {up ? "+" : "−"}
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span>{hint}</span>
        </p>
      </CardContent>
    </Card>
  )
}
