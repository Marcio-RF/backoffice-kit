import { Suspense } from "react"

import { RoutedDialog } from "@/components/routed-dialog/routed-dialog"

import { EditOrder } from "../../../../orders/[id]/edit/edit-order"
import { OrderDetailSkeleton } from "../../../../orders/[id]/order-detail"

// Opened from the Detail: the form swaps in, in the same Dialog roteado; saving goes back to the Detail.
export default function EditOrderDialog({ params }: PageProps<"/orders/[id]/edit">) {
  return (
    <RoutedDialog>
      <Suspense fallback={<OrderDetailSkeleton />}>
        <EditOrder params={params} />
      </Suspense>
    </RoutedDialog>
  )
}
