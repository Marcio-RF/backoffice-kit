"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { markItemChanged } from "@/components/data-table/list-updates"
import { useRoutedDialog } from "@/components/routed-dialog/routed-dialog"
import { Button } from "@/components/ui/button"

import { removeOrder } from "../actions"

/** The actions the row menu offers on desktop, in the Detail footer for every size. */
export function OrderActions({ id }: { id: string }) {
  const frame = useRoutedDialog()
  const router = useRouter()
  const [deleting, setDeleting] = React.useState(false)

  async function remove() {
    setDeleting(true)
    await removeOrder(id)
    toast.success(`${id} deleted`)
    // The list keeps the row, marked as deleted, until the next search.
    markItemChanged("orders", id)
    if (frame.mode === "dialog") frame.close({ force: true })
    else router.push("/orders")
  }

  return (
    <>
      <Button variant="outline" onClick={() => navigator.clipboard?.writeText(id)}>
        Copy order ID
      </Button>
      <Button variant="destructive" disabled={deleting} onClick={remove}>
        Delete
      </Button>
      <Button asChild>
        <Link href={`/orders/${id}/edit`}>Edit</Link>
      </Button>
    </>
  )
}
