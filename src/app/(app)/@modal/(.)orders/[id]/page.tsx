import { Suspense } from "react"

import { RoutedDialog } from "@/components/routed-dialog/routed-dialog"

import { OrderDetail, OrderDetailSkeleton } from "../../../orders/[id]/order-detail"

// Opened from the list: the Detail in a Dialog roteado, over the list.
export default function OrderDialog({ params }: PageProps<"/orders/[id]">) {
  return (
    <RoutedDialog>
      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetail params={params} />
      </Suspense>
    </RoutedDialog>
  )
}
