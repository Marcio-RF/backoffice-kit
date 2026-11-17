import { Upload, UserPlus, Users } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/empty-state"
import { PageContainer, PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Customers" }

export default function CustomersPage() {
  return (
    <PageContainer>
      <PageHeader title="Customers" description="People who have placed at least one order." />
      <EmptyState
        icon={Users}
        title="No customers yet"
        description="Customers appear here after their first order. You can also import an existing list."
        action={
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload aria-hidden />
              Import CSV
            </Button>
            <Button>
              <UserPlus aria-hidden />
              Add customer
            </Button>
          </div>
        }
      />
    </PageContainer>
  )
}
