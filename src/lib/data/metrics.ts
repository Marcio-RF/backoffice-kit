export type DailyPoint = { date: string; revenue: number; orders: number }

function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const daily: DailyPoint[] = (() => {
  const r = rng(7)
  const end = Date.UTC(2026, 10, 16)
  return Array.from({ length: 90 }, (_, i) => {
    const d = new Date(end - (89 - i) * 86400000)
    const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6
    const trend = 3200 + i * 22
    const revenue = Math.round(trend * (weekend ? 1.25 : 1) * (0.8 + r() * 0.4))
    return { date: d.toISOString().slice(0, 10), revenue, orders: Math.round(revenue / 410) }
  })
})()

const total90 = daily.reduce((s, d) => s + d.revenue, 0)
export const byChannel = [
  { channel: "Website", share: 0.57 },
  { channel: "Partners", share: 0.29 },
  { channel: "Phone", share: 0.1 },
  { channel: "Walk-in", share: 0.04 },
].map((c) => ({ channel: c.channel, revenue: Math.round(total90 * c.share) }))

const last30 = daily.slice(-30)
const prev30 = daily.slice(-60, -30)
const sum = (xs: DailyPoint[], k: "revenue" | "orders") => xs.reduce((s, d) => s + d[k], 0)
const pct = (a: number, b: number) => ((a - b) / b) * 100

const revenue = sum(last30, "revenue")
const ordersCount = sum(last30, "orders")
const prevRevenue = sum(prev30, "revenue")
const prevOrders = sum(prev30, "orders")

const eur = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
const eur2 = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" })
const int = new Intl.NumberFormat("en-GB")

export const kpis = [
  { label: "Revenue", value: eur.format(revenue), delta: pct(revenue, prevRevenue), hint: "vs previous 30 days", series: last30.map((d) => d.revenue) },
  { label: "Orders", value: int.format(ordersCount), delta: pct(ordersCount, prevOrders), hint: "vs previous 30 days", series: last30.map((d) => d.orders) },
  { label: "Average order", value: eur2.format(revenue / ordersCount), delta: pct(revenue / ordersCount, prevRevenue / prevOrders), hint: "vs previous 30 days", series: null },
  { label: "Cancellation rate", value: "4.2%", delta: -1.3, hint: "lower is better", series: null, invert: true },
] as const
