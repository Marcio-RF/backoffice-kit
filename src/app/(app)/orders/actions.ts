"use server"

import type { ListQuery } from "@/components/data-table/list-source"
import type { Order } from "@/lib/data/orders"
import { createOrder, deleteOrder, findOrder, matches, queryOrders, updateOrder } from "@/lib/data/orders-store"

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

export type OrderValues = {
  customer: string
  email: string
  amount: number
  channel: Order["channel"]
  status: Order["status"]
}

/** Creates an order, or updates it when `id` is given. Returns the saved order. */
export async function saveOrder(id: string | null, values: OrderValues) {
  await latency()
  return id ? updateOrder(id, values) : createOrder(values)
}

export async function removeOrder(id: string) {
  await latency()
  deleteOrder(id)
}
