"use client"

import {
  type Cell,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type RowData,
  type Table as TanTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mergeLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"

export type Density = "comfortable" | "compact"

/** Where a column's cell goes in a card on the Celular (below `md`). Columns without a slot stay out of the card. */
export type CardSlot = "title" | "subtitle" | "status" | "value"

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    mobile?: CardSlot
  }
}

const CardCellContext = React.createContext(false)

/** True while a cell renders inside a card, where nested interactive elements are not allowed. */
export function useIsCardCell() {
  return React.useContext(CardCellContext)
}

export type DataTableLabels = {
  noResults: string
  previousPage: string
  nextPage: string
  /** Pagination range, e.g. "1–15 of 40". */
  range: (from: number, to: number, total: number) => string
  /** Selection count, e.g. "2 of 40 selected". */
  selected: (selected: number, total: number) => string
}

export const defaultDataTableLabels: DataTableLabels = {
  noResults: "No results.",
  previousPage: "Previous page",
  nextPage: "Next page",
  range: (from, to, total) => `${from}–${to} of ${total}`,
  selected: (selected, total) => `${selected} of ${total} selected`,
}

type DataTableProps<TData> = {
  columns: ColumnDef<TData>[]
  data: TData[]
  /** Accessible name for the table. */
  label: string
  toolbar?: (table: TanTable<TData>, density: Density, setDensity: (d: Density) => void) => React.ReactNode
  onRowClick?: (row: TData) => void
  pageSize?: number
  emptyState?: React.ReactNode
  /** Partial overrides, merged over `defaultDataTableLabels`. */
  labels?: Partial<DataTableLabels>
}

export function DataTable<TData>({
  columns,
  data,
  label,
  toolbar,
  onRowClick,
  pageSize = 15,
  emptyState,
  labels,
}: DataTableProps<TData>) {
  const t = mergeLabels(defaultDataTableLabels, labels)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [density, setDensity] = React.useState<Density>("comfortable")

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
    initialState: { pagination: { pageSize } },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const rows = table.getRowModel().rows
  const filtered = table.getFilteredRowModel().rows.length
  const selected = table.getFilteredSelectedRowModel().rows.length
  const { pageIndex } = table.getState().pagination
  const size = table.getState().pagination.pageSize
  const from = filtered === 0 ? 0 : pageIndex * size + 1
  const to = Math.min(filtered, (pageIndex + 1) * size)

  const visibleColumns = table.getVisibleLeafColumns()
  const hasSlots = visibleColumns.some((c) => c.columnDef.meta?.mobile)
  // Without any slot, the first visible column that holds data becomes the title.
  const fallbackTitleId = hasSlots ? undefined : visibleColumns.find((c) => c.accessorFn)?.id

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production" && !hasSlots) {
      console.warn(
        `DataTable "${label}": no column sets meta.mobile, so the first column with data is the card title. Set meta.mobile to "title" | "subtitle" | "status" | "value".`,
      )
    }
  }, [hasSlots, label])

  const slotOf = (cell: Cell<TData, unknown>): CardSlot | undefined =>
    cell.column.columnDef.meta?.mobile ?? (cell.column.id === fallbackTitleId ? "title" : undefined)

  return (
    <div role="region" aria-label={label} className="flex flex-col gap-3">
      {toolbar?.(table, density, setDensity)}
      <ul aria-label={label} className="flex flex-col overflow-hidden rounded-lg border bg-card md:hidden">
        {rows.length ? (
          rows.map((row) => (
            <DataCard
              key={row.id}
              cells={row.getVisibleCells()}
              slotOf={slotOf}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            />
          ))
        ) : (
          <li className="flex h-48 items-center justify-center text-center text-muted-foreground">
            {emptyState ?? t.noResults}
          </li>
        )}
      </ul>
      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <Table aria-label={label} data-density={density} className="group/table">
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.column.columnDef.size !== 150 ? header.column.columnDef.size : undefined }}
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
                    className="h-9 text-xs font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="h-10 py-1.5 group-data-[density=compact]/table:h-8 group-data-[density=compact]/table:py-0.5"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-48 text-center text-muted-foreground">
                  {emptyState ?? t.noResults}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground">
        <p role="status" className="tabular-nums">
          {selected > 0 ? `${t.selected(selected, filtered)} · ` : null}
          {t.range(from, to, filtered)}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={t.previousPage}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={t.nextPage}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

function DataCard<TData>({
  cells,
  slotOf,
  onClick,
}: {
  cells: Cell<TData, unknown>[]
  slotOf: (cell: Cell<TData, unknown>) => CardSlot | undefined
  onClick?: () => void
}) {
  const titleId = React.useId()
  const slot = (name: CardSlot) => {
    const content = cells.filter((c) => slotOf(c) === name).map((c) => (
      <React.Fragment key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</React.Fragment>
    ))
    return content.length ? content : null
  }
  const title = slot("title")
  const status = slot("status")
  const subtitle = slot("subtitle")
  const value = slot("value")
  // Without `onRowClick` the card is plain content, not a dead button.
  const Wrapper = onClick ? "button" : "div"

  return (
    <li className="border-b last:border-b-0">
      <CardCellContext.Provider value>
        <Wrapper
          {...(onClick ? { type: "button" as const, onClick, "aria-labelledby": title ? titleId : undefined } : {})}
          className="flex min-h-11 w-full flex-col gap-1 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {title || status ? (
            <span className="flex items-start justify-between gap-3">
              {title ? (
                <span id={titleId} data-slot="card-title" className="min-w-0 font-medium">
                  {title}
                </span>
              ) : (
                <span />
              )}
              {status ? (
                <span data-slot="card-status" className="shrink-0">
                  {status}
                </span>
              ) : null}
            </span>
          ) : null}
          {subtitle || value ? (
            <span className="flex items-baseline justify-between gap-3 text-muted-foreground">
              {subtitle ? (
                <span data-slot="card-subtitle" className="flex min-w-0 flex-wrap items-center gap-x-2">
                  {subtitle}
                </span>
              ) : (
                <span />
              )}
              {value ? (
                <span data-slot="card-value" className="shrink-0 text-foreground tabular-nums">
                  {value}
                </span>
              ) : null}
            </span>
          ) : null}
        </Wrapper>
      </CardCellContext.Provider>
    </li>
  )
}
