import type { Metadata } from "next"
import { Suspense } from "react"

import { RoutedPage } from "@/components/routed-dialog/routed-dialog"

import { OrderDetailSkeleton } from "../../orders/[id]/order-detail"
import { CustomerDetail } from "./customer-detail"

export const metadata: Metadata = { title: "Customer" }

export default function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  return (
    <RoutedPage backHref="/customers">
      <Suspense fallback={<OrderDetailSkeleton />}>
        <CustomerDetail params={params} />
      </Suspense>
    </RoutedPage>
  )
}
