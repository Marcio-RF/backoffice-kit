import { RoutedDialog } from "@/components/routed-dialog/routed-dialog"

import { QuickOrder } from "../../../(flow)/quick-order/quick-order"

// The Fluxo móvel opened from the list: the dialog draws no header, the flow brings its own bar.
export default function QuickOrderDialog() {
  return (
    <RoutedDialog chrome="none">
      <QuickOrder />
    </RoutedDialog>
  )
}
