"use client"

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { byChannel } from "@/lib/data/metrics"

const config = { revenue: { label: "Revenue", color: "var(--chart-1)" } } satisfies ChartConfig
const eurCompact = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", notation: "compact" })

/** Magnitude by category: one hue, horizontal bars, direct value labels, no legend. */
export function ChannelChart() {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Revenue by channel</CardTitle>
        <CardDescription>Last 90 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-52 w-full">
          <BarChart data={byChannel} layout="vertical" margin={{ left: 0, right: 48 }} barCategoryGap={10} accessibilityLayer>
            <XAxis type="number" dataKey="revenue" hide />
            <YAxis type="category" dataKey="channel" tickLine={false} axisLine={false} width={72} />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={<ChartTooltipContent hideLabel formatter={(v, _n, item) => (
                <div className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">{item.payload.channel}</span>
                  <span className="font-mono font-medium tabular-nums">{eurCompact.format(Number(v))}</span>
                </div>
              )} />}
            />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4}>
              <LabelList
                dataKey="revenue"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(v: unknown) => eurCompact.format(Number(v))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
