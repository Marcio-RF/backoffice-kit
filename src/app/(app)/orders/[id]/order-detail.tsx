import Link from "next/link"
import { notFound } from "next/navigation"

import {
  RoutedDialogBody,
  RoutedDialogDescription,
  RoutedDialogFooter,
  RoutedDialogHeader,
  RoutedDialogTitle,
} from "@/components/routed-dialog/routed-dialog"
import { StatusBadge } from "@/components/status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { currency, dateTime, statusMeta } from "@/lib/data/orders"
import { customerSlug, findOrder } from "@/lib/data/orders-store"

import { OrderActions } from "./order-actions"

/** The Detail of an order: the same content in the dialog and on the full page. */
export async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = findOrder(decodeURIComponent(id))
  if (!order) notFound()
  const m = statusMeta[order.status]
  return (
    <>
      <RoutedDialogHeader>
        <RoutedDialogDescription className="font-mono text-xs">{order.id}</RoutedDialogDescription>
        <RoutedDialogTitle>{order.customer}</RoutedDialogTitle>
        <div>
          <StatusBadge tone={m.tone}>{m.label}</StatusBadge>
        </div>
      </RoutedDialogHeader>
      <RoutedDialogBody>
        <dl className="grid grid-cols-[8rem_1fr] items-baseline gap-x-4 gap-y-3 px-4">
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-medium tabular-nums">{currency.format(order.amount)}</dd>
          <dt className="text-muted-foreground">Customer</dt>
          <dd className="min-w-0">
            <Link
              href={`/customers/${customerSlug(order)}`}
              className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline md:min-h-0"
            >
              {order.customer}
            </Link>
          </dd>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate">{order.email}</dd>
          <dt className="text-muted-foreground">Channel</dt>
          <dd>{order.channel}</dd>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="tabular-nums">{dateTime.format(new Date(order.createdAt))}</dd>
        </dl>
      </RoutedDialogBody>
      <RoutedDialogFooter>
        <OrderActions id={order.id} />
      </RoutedDialogFooter>
    </>
  )
}

export function OrderDetailSkeleton() {
  return (
    <>
      <RoutedDialogHeader>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-1 h-6 w-48" />
      </RoutedDialogHeader>
      <RoutedDialogBody>
        <div className="flex flex-col gap-3 px-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </RoutedDialogBody>
    </>
  )
}
