"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { ColumnHeader } from "@/components/data-table/column-header"
import { DataTable, useIsCardCell } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { multiValueFilter } from "@/components/data-table/faceted-filter"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Order, currency, dateTime, statusMeta } from "@/lib/data/orders"

import { fetchOrdersPage } from "./actions"

const copyOrderId = (order: Order) => navigator.clipboard?.writeText(order.id)
const cancelOrder = (order: Order) =>
  toast.success(`${order.id} cancelled`, { description: "The customer was notified." })

export const orderHref = (order: Order) => `/orders/${order.id}`

function OrderLink({ order }: { order: Order }) {
  // Inside a card the whole card is the link, so the ID is plain text there.
  const inCard = useIsCardCell()
  const className = "rounded font-mono text-xs font-medium"
  if (inCard) return <span className={className}>{order.id}</span>
  return (
    <Link
      href={orderHref(order)}
      data-slot="row-link"
      className={`${className} inline-flex items-center hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`}
    >
      {order.id}
    </Link>
  )
}

function buildColumns(open: (o: Order) => void): ColumnDef<Order>[] {
  return [
    {
      id: "select",
      size: 36,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all loaded"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${row.original.id}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: ({ column }) => <ColumnHeader column={column} title="Order" />,
      meta: { mobile: "subtitle", title: "Order" },
      cell: ({ row }) => <OrderLink order={row.original} />,
      enableHiding: false,
    },
    {
      accessorKey: "customer",
      meta: { mobile: "title", title: "Customer" },
      header: ({ column }) => <ColumnHeader column={column} title="Customer" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{row.original.customer}</div>
          <div className="truncate text-xs text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      meta: { mobile: "status" },
      header: "Status",
      cell: ({ row }) => {
        const m = statusMeta[row.original.status]
        return <StatusBadge tone={m.tone}>{m.label}</StatusBadge>
      },
      filterFn: multiValueFilter,
    },
    {
      accessorKey: "channel",
      header: "Channel",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.channel}</span>,
      filterFn: multiValueFilter,
    },
    {
      accessorKey: "createdAt",
      meta: { mobile: "subtitle", title: "Created" },
      header: ({ column }) => <ColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <time dateTime={row.original.createdAt} className="text-muted-foreground">
          {dateTime.format(new Date(row.original.createdAt))}
        </time>
      ),
    },
    {
      accessorKey: "amount",
      meta: { mobile: "value", title: "Amount" },
      header: ({ column }) => <ColumnHeader column={column} title="Amount" align="right" />,
      cell: ({ row }) => <div className="text-right font-medium">{currency.format(row.original.amount)}</div>,
    },
    {
      id: "actions",
      size: 44,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Actions for ${row.original.id}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => open(row.original)}>View details</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => copyOrderId(row.original)}>
                Copy order ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => cancelOrder(row.original)}
              >
                Cancel order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
}

const statusOptions = Object.entries(statusMeta).map(([value, m]) => ({ value, label: m.label }))
const channelOptions = ["Website", "Partner", "Phone"].map((v) => ({ value: v, label: v }))

const count = new Intl.NumberFormat("en-US")
const ordersLabels = {
  total: (loaded: number, total: number) =>
    `${count.format(loaded)} of ${count.format(total)} ${total === 1 ? "order" : "orders"}`,
}

export function OrdersTable() {
  const router = useRouter()
  const columns = React.useMemo(() => buildColumns((o) => router.push(orderHref(o))), [router])

  return (
    <>
      <DataTable
        label="Orders"
        columns={columns}
        fetchPage={fetchOrdersPage}
        getRowHref={orderHref}
        labels={ordersLabels}
        toolbar={(table, density, setDensity) => (
          <DataTableToolbar
            table={table}
            density={density}
            onDensityChange={setDensity}
            search={{ label: "Search orders", placeholder: "Search orders…" }}
            filters={[
              { column: "status", title: "Status", options: statusOptions },
              { column: "channel", title: "Channel", options: channelOptions },
            ]}
          />
        )}
      />
    </>
  )
}
