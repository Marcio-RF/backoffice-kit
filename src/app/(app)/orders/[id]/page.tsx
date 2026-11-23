import type { Metadata } from "next"
import { Suspense } from "react"

import { RoutedPage } from "@/components/routed-dialog/routed-dialog"

import { OrderDetail, OrderDetailSkeleton } from "./order-detail"

export const metadata: Metadata = { title: "Order" }

// Same URL as the dialog, opened directly or after F5: the same Detail as a page.
export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <RoutedPage backHref="/orders">
      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetail params={params} />
      </Suspense>
    </RoutedPage>
  )
}
