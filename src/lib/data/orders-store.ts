import type { ListPage, ListQuery } from "@/components/data-table/list-source"
import { type Order, orders } from "@/lib/data/orders"

/**
 * Fake back end for the Orders example: 2,000 orders in server memory, changed by the server actions.
 * A real project queries its database here with a cursor.
 */
const store: Order[] = orders.map((o) => ({ ...o }))

export const pageSize = 50

const facetColumns = ["status", "channel"] as const

function matchesSearch(o: Order, q?: string) {
  if (!q) return true
  const needle = q.trim().toLowerCase()
  return [o.id, o.customer, o.email].some((v) => v.toLowerCase().includes(needle))
}

function matchesFilters(o: Order, filters: ListQuery["filters"], except?: string) {
  return Object.entries(filters).every(
    ([column, values]) => column === except || !values.length || values.includes(String(o[column as keyof Order])),
  )
}

export function matches(o: Order, query: ListQuery) {
  return matchesSearch(o, query.q) && matchesFilters(o, query.filters)
}

function compare(a: Order, b: Order, sort: ListQuery["sort"]) {
  const id = (sort?.id ?? "createdAt") as keyof Order
  const desc = sort ? sort.desc : true
  const x = a[id]
  const y = b[id]
  const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))
  return desc ? -order : order
}

export function queryOrders(cursor: string | null, query: ListQuery): ListPage<Order> {
  const found = store.filter((o) => matches(o, query)).sort((a, b) => compare(a, b, query.sort))
  const start = cursor ? Number(cursor) : 0
  const items = found.slice(start, start + pageSize)
  const next = start + pageSize
  // Each facet counts with the other filters applied, so picking a status doesn't zero the other statuses.
  const facets = Object.fromEntries(
    facetColumns.map((column) => {
      const counts: Record<string, number> = {}
      for (const o of store) {
        if (!matchesSearch(o, query.q) || !matchesFilters(o, query.filters, column)) continue
        const value = String(o[column])
        counts[value] = (counts[value] ?? 0) + 1
      }
      return [column, counts]
    }),
  )
  return { items, nextCursor: next < found.length ? String(next) : null, total: found.length, facets }
}

export function findOrder(id: string) {
  return store.find((o) => o.id === id)
}

export function updateOrder(id: string, changes: Partial<Omit<Order, "id">>) {
  const order = findOrder(id)
  if (order) Object.assign(order, changes)
  return order
}

export function createOrder(values: Omit<Order, "id" | "createdAt">) {
  const top = Math.max(...store.map((o) => Number(o.id.slice(4))))
  const order: Order = { ...values, id: `ORD-${top + 1}`, createdAt: new Date().toISOString() }
  store.unshift(order)
  return order
}

export function deleteOrder(id: string) {
  const index = store.findIndex((o) => o.id === id)
  if (index >= 0) store.splice(index, 1)
}

/** A customer of the example: whoever placed orders with the same email. */
export function customerSlug(order: Pick<Order, "email">) {
  return order.email.split("@")[0]
}

export function findCustomer(slug: string) {
  const orders = store.filter((o) => customerSlug(o) === slug)
  if (!orders.length) return undefined
  return {
    slug,
    name: orders[0].customer,
    email: orders[0].email,
    orders: [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    total: orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.amount, 0),
  }
}
