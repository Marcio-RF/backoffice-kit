"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
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

  return (
    <div className="flex flex-col gap-3">
      {toolbar?.(table, density, setDensity)}
      <div className="overflow-hidden rounded-lg border bg-card">
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
