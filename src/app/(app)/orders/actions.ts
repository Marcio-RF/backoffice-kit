"use server"

import type { ListQuery } from "@/components/data-table/list-source"
import { findOrder, matches, queryOrders } from "@/lib/data/orders-store"

const latency = () => new Promise((resolve) => setTimeout(resolve, 150))

export async function fetchOrdersPage({ cursor, query }: { cursor: string | null; query: ListQuery }) {
  await latency()
  return queryOrders(cursor, query)
}

export async function fetchOrder(id: string, query: ListQuery) {
  await latency()
  const item = findOrder(id)
  return item ? { item: { ...item }, matches: matches(item, query) } : null
}
