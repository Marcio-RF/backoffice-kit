import { RoutedDialog } from "@/components/routed-dialog/routed-dialog"

import { OrderForm } from "../../../orders/order-form"

export default function NewOrderDialog() {
  return (
    <RoutedDialog>
      <OrderForm />
    </RoutedDialog>
  )
}
