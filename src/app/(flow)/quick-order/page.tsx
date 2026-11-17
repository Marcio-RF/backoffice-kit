import type { Metadata } from "next"

import { QuickOrder } from "./quick-order"

export const metadata: Metadata = { title: "Quick order" }

export default function QuickOrderPage() {
  return <QuickOrder />
}
