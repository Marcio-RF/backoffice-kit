"use client"

import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

/** The actions the row menu offers on desktop, in the Detail footer for every size. */
export function OrderActions({ id }: { id: string }) {
  return (
    <>
      <Button variant="outline" onClick={() => navigator.clipboard?.writeText(id)}>
        Copy order ID
      </Button>
      <Button
        variant="destructive"
        onClick={() => toast.success(`${id} cancelled`, { description: "The customer was notified." })}
      >
        Cancel order
      </Button>
      <Button asChild>
        <Link href={`/orders/${id}/edit`}>Edit</Link>
      </Button>
    </>
  )
}
