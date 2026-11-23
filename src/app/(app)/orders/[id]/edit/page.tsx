import type { Metadata } from "next"
import { Suspense } from "react"

import { RoutedPage } from "@/components/routed-dialog/routed-dialog"

import { OrderDetailSkeleton } from "../order-detail"
import { EditOrder } from "./edit-order"

export const metadata: Metadata = { title: "Edit order" }

export default async function EditOrderPage({ params }: PageProps<"/orders/[id]/edit">) {
  return (
    <RoutedPage backHref="/orders" className="max-w-5xl">
      <Suspense fallback={<OrderDetailSkeleton />}>
        <EditOrder params={params} />
      </Suspense>
    </RoutedPage>
  )
}
