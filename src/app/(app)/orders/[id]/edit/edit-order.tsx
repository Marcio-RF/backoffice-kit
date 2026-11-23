import { notFound } from "next/navigation"

import { findOrder } from "@/lib/data/orders-store"

import { OrderForm } from "../../order-form"

export async function EditOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = findOrder(decodeURIComponent(id))
  if (!order) notFound()
  return <OrderForm order={{ ...order }} />
}
