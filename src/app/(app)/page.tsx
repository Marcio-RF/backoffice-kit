import { ArrowRight, Download } from "lucide-react"
import Link from "next/link"

import { ChannelChart } from "@/components/dashboard/channel-chart"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { PageContainer, PageHeader } from "@/components/shell/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { kpis } from "@/lib/data/metrics"
import { currency, orders, statusMeta } from "@/lib/data/orders"

export default function OverviewPage() {
  const recent = orders.slice(0, 6)

  return (
    <PageContainer>
      <PageHeader
        title="Overview"
        description="Last 30 days · updated 5 minutes ago"
        actions={
          <Button variant="outline">
            <Download aria-hidden />
            Export report
          </Button>
        }
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.label}
            label={k.label}
            value={k.value}
            delta={k.delta}
            hint={k.hint}
            series={k.series}
            invert={"invert" in k ? k.invert : false}
          />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <ChannelChart />
      </div>

      <Card className="gap-2">
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/orders">
                View all
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y">
            {recent.map((o) => {
              const m = statusMeta[o.status]
              return (
                <li key={o.id} className="flex items-center gap-4 px-6 py-2.5">
                  <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{o.id}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{o.customer}</span>
                  <StatusBadge tone={m.tone} className="hidden sm:inline-flex">
                    {m.label}
                  </StatusBadge>
                  <span className="w-24 text-right font-medium tabular-nums">{currency.format(o.amount)}</span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
