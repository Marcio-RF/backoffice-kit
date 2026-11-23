import Link from "next/link"
import { notFound } from "next/navigation"

import {
  RoutedDialogBody,
  RoutedDialogDescription,
  RoutedDialogHeader,
  RoutedDialogTitle,
} from "@/components/routed-dialog/routed-dialog"
import { StatusBadge } from "@/components/status-badge"
import { currency, dateTime, statusMeta } from "@/lib/data/orders"
import { findCustomer } from "@/lib/data/orders-store"

/** A customer and their orders. Opening an order from here swaps the content in the same dialog. */
export async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = findCustomer(decodeURIComponent(id))
  if (!customer) notFound()
  return (
    <>
      <RoutedDialogHeader>
        <RoutedDialogDescription>Customer</RoutedDialogDescription>
        <RoutedDialogTitle>{customer.name}</RoutedDialogTitle>
      </RoutedDialogHeader>
      <RoutedDialogBody>
        <dl className="grid grid-cols-[8rem_1fr] items-baseline gap-x-4 gap-y-3 px-4">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate">{customer.email}</dd>
          <dt className="text-muted-foreground">Orders</dt>
          <dd className="tabular-nums">{customer.orders.length}</dd>
          <dt className="text-muted-foreground">Total spent</dt>
          <dd className="font-medium tabular-nums">{currency.format(customer.total)}</dd>
        </dl>
        <section aria-labelledby="customer-orders" className="flex flex-col gap-2">
          <h3 id="customer-orders" className="px-4 font-medium">
            Recent orders
          </h3>
          <ul className="flex flex-col border-y">
            {customer.orders.slice(0, 8).map((o) => {
              const m = statusMeta[o.status]
              return (
                <li key={o.id} className="border-b last:border-b-0">
                  <Link
                    href={`/orders/${o.id}`}
                    className="flex min-h-11 items-center justify-between gap-3 px-4 py-2 outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-mono text-xs font-medium">{o.id}</span>
                      <span className="text-muted-foreground">{dateTime.format(new Date(o.createdAt))}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <StatusBadge tone={m.tone}>{m.label}</StatusBadge>
                      <span className="tabular-nums">{currency.format(o.amount)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </RoutedDialogBody>
    </>
  )
}
