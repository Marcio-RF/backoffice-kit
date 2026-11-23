import type { Metadata } from "next"

import { RoutedPage } from "@/components/routed-dialog/routed-dialog"

import { OrderForm } from "../order-form"

export const metadata: Metadata = { title: "New order" }

// Opened directly or after F5; from the list the same form opens in the Dialog roteado.
export default function NewOrderPage() {
  return (
    <RoutedPage backHref="/orders" className="max-w-5xl">
      <OrderForm />
    </RoutedPage>
  )
}
