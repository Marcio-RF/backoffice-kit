"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Columns3, MoreHorizontal, Rows3, Rows4, Search, X } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { ColumnHeader } from "@/components/data-table/column-header"
import { DataTable, useIsCardCell } from "@/components/data-table/data-table"
import { FacetedFilter } from "@/components/data-table/faceted-filter"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { type Order, currency, dateTime, orders, statusMeta } from "@/lib/data/orders"

const multi = (row: { getValue: (id: string) => unknown }, id: string, value: string[]) =>
  value.includes(row.getValue(id) as string)

function OrderLink({ order, open }: { order: Order; open: (o: Order) => void }) {
  // Inside a card the whole card is the button, so the ID is plain text there.
  const inCard = useIsCardCell()
  const className = "rounded font-mono text-xs font-medium"
  if (inCard) return <span className={className}>{order.id}</span>
  return (
    <button
      type="button"
      data-slot="row-link"
      onClick={(e) => {
        e.stopPropagation()
        open(order)
      }}
      className={`${className} hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`}
    >
      {order.id}
    </button>
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
          aria-label="Select all on this page"
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
      meta: { mobile: "subtitle" },
      cell: ({ row }) => <OrderLink order={row.original} open={open} />,
      enableHiding: false,
    },
    {
      accessorKey: "customer",
      meta: { mobile: "title" },
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
      filterFn: multi,
    },
    {
      accessorKey: "channel",
      header: "Channel",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.channel}</span>,
      filterFn: multi,
    },
    {
      accessorKey: "createdAt",
      meta: { mobile: "subtitle" },
      header: ({ column }) => <ColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <time dateTime={row.original.createdAt} className="text-muted-foreground">
          {dateTime.format(new Date(row.original.createdAt))}
        </time>
      ),
    },
    {
      accessorKey: "amount",
      meta: { mobile: "value" },
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
              <DropdownMenuItem onSelect={() => navigator.clipboard?.writeText(row.original.id)}>
                Copy order ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => toast.success(`${row.original.id} cancelled`, { description: "The customer was notified." })}
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

export function OrdersTable() {
  const [current, setCurrent] = React.useState<Order | null>(null)
  const columns = React.useMemo(() => buildColumns(setCurrent), [])

  return (
    <>
      <DataTable
        label="Orders"
        columns={columns}
        data={orders}
        onRowClick={setCurrent}
        toolbar={(table, density, setDensity) => {
          const filtered = table.getState().columnFilters.length > 0 || !!table.getState().globalFilter
          return (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  aria-label="Search orders"
                  placeholder="Search orders…"
                  value={(table.getState().globalFilter as string) ?? ""}
                  onChange={(e) => table.setGlobalFilter(e.target.value)}
                  className="w-56 pl-8 lg:w-72"
                />
              </div>
              <FacetedFilter column={table.getColumn("status")} title="Status" options={statusOptions} />
              <FacetedFilter column={table.getColumn("channel")} title="Channel" options={channelOptions} />
              {filtered ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    table.resetColumnFilters()
                    table.setGlobalFilter("")
                  }}
                >
                  Reset
                  <X aria-hidden />
                </Button>
              ) : null}
              <div className="ml-auto flex items-center gap-2">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={density}
                  onValueChange={(v) => v && setDensity(v as typeof density)}
                  aria-label="Row density"
                >
                  <ToggleGroupItem value="comfortable" aria-label="Comfortable rows">
                    <Rows3 />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="compact" aria-label="Compact rows">
                    <Rows4 />
                  </ToggleGroupItem>
                </ToggleGroup>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Columns3 aria-hidden />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Toggle columns</DropdownMenuLabel>
                    {table
                      .getAllColumns()
                      .filter((c) => c.getCanHide())
                      .map((c) => (
                        <DropdownMenuCheckboxItem
                          key={c.id}
                          checked={c.getIsVisible()}
                          onCheckedChange={(v) => c.toggleVisibility(!!v)}
                          className="capitalize"
                        >
                          {c.id === "createdAt" ? "Created" : c.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        }}
      />
      <OrderSheet order={current} onOpenChange={(o) => !o && setCurrent(null)} />
    </>
  )
}

function OrderSheet({ order, onOpenChange }: { order: Order | null; onOpenChange: (open: boolean) => void }) {
  const m = order ? statusMeta[order.status] : null
  return (
    <Sheet open={!!order} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        {order && m ? (
          <>
            <SheetHeader>
              <SheetDescription className="font-mono text-xs">{order.id}</SheetDescription>
              <SheetTitle className="text-lg">{order.customer}</SheetTitle>
              <div>
                <StatusBadge tone={m.tone}>{m.label}</StatusBadge>
              </div>
            </SheetHeader>
            <Separator />
            <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 px-4">
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium tabular-nums">{currency.format(order.amount)}</dd>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="truncate">{order.email}</dd>
              <dt className="text-muted-foreground">Channel</dt>
              <dd>{order.channel}</dd>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="tabular-nums">{dateTime.format(new Date(order.createdAt))}</dd>
            </dl>
            <SheetFooter className="flex-row justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={() => toast.success(`${order.id} confirmed`)}>Confirm order</Button>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
