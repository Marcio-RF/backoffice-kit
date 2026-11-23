import { Suspense } from "react"

import { RoutedDialog } from "@/components/routed-dialog/routed-dialog"

import { CustomerDetail } from "../../../customers/[id]/customer-detail"
import { OrderDetailSkeleton } from "../../../orders/[id]/order-detail"

// Opened from an order: the customer swaps in, in the same Dialog roteado.
export default function CustomerDialog({ params }: PageProps<"/customers/[id]">) {
  return (
    <RoutedDialog>
      <Suspense fallback={<OrderDetailSkeleton />}>
        <CustomerDetail params={params} />
      </Suspense>
    </RoutedDialog>
  )
}
