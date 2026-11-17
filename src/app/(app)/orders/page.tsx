import { Download, Plus } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { TableSkeleton } from "@/components/data-table/table-skeleton"
import { PageContainer, PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"

import { OrdersTable } from "./orders-table"

export const metadata: Metadata = { title: "Orders" }

export default function OrdersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Orders"
        description="Every order across channels. Click a row for details."
        actions={
          <>
            <Button variant="outline">
              <Download aria-hidden />
              Export
            </Button>
            <Button asChild>
              <Link href="/orders/new">
                <Plus aria-hidden />
                New order
              </Link>
            </Button>
          </>
        }
      />
      <Suspense fallback={<TableSkeleton />}>
        <OrdersTable />
      </Suspense>
    </PageContainer>
  )
}
