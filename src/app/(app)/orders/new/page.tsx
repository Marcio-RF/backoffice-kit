import type { Metadata } from "next"

import { PageContainer, PageHeader } from "@/components/shell/page-header"

import { OrderForm } from "./order-form"

export const metadata: Metadata = { title: "New order" }

export default function NewOrderPage() {
  return (
    <PageContainer className="max-w-5xl pb-0">
      <PageHeader title="New order" description="Create an order on behalf of a customer." />
      <OrderForm />
    </PageContainer>
  )
}
