"use client"

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
      <Button onClick={() => toast.success(`${id} confirmed`)}>Confirm order</Button>
    </>
  )
}
