export type OrderStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"

export type Order = {
  id: string
  customer: string
  email: string
  channel: "Website" | "Partner" | "Phone"
  status: OrderStatus
  amount: number
  createdAt: string
}

export const statusMeta: Record<OrderStatus, { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }> = {
  pending: { label: "Pending", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "info" },
  in_progress: { label: "In progress", tone: "neutral" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
}

const first = ["Ana", "Bruno", "Clara", "David", "Emma", "Felix", "Greta", "Hugo", "Inês", "Jonas", "Lea", "Marco", "Nora", "Omar", "Paula", "Rui"]
const last = ["Silva", "Müller", "Dubois", "García", "Rossi", "de Vries", "Santos", "Schmidt", "Martin", "López"]
const channels: Order["channel"][] = ["Website", "Website", "Website", "Partner", "Phone"]
const statuses: OrderStatus[] = ["pending", "confirmed", "confirmed", "in_progress", "completed", "completed", "completed", "cancelled"]

// Deterministic pseudo-random so server and client render the same rows.
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const orders: Order[] = (() => {
  const r = rng(42)
  const base = Date.UTC(2026, 10, 16)
  return Array.from({ length: 64 }, (_, i) => {
    const f = first[Math.floor(r() * first.length)]
    const l = last[Math.floor(r() * last.length)]
    return {
      id: `ORD-${(20480 - i).toString()}`,
      customer: `${f} ${l}`,
      email: `${f}.${l}`.normalize("NFD").toLowerCase().replace(/[^a-z.]/g, "") + "@example.com",
      channel: channels[Math.floor(r() * channels.length)],
      status: statuses[Math.floor(r() * statuses.length)],
      amount: Math.round((80 + r() * 1400) * 100) / 100,
      createdAt: new Date(base - i * 9 * 3600 * 1000 - Math.floor(r() * 3600 * 1000)).toISOString(),
    }
  })
})()

export const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" })
export const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
})
