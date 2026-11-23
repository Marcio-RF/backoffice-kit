"use client"

import {
  type Cell,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type Row,
  type RowData,
  type SortingState,
  type Table as TanTable,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useWindowVirtualizer } from "@tanstack/react-virtual"
import * as React from "react"

import { useUrlListQuery } from "@/components/data-table/list-query"
import { type FetchPage, type ListQuery, useInfiniteList } from "@/components/data-table/list-source"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
    /** Plain-text name of the column for menus (Sort by, column visibility) when `header` is not a string. */
    title?: string
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    /** Every record that matches the query, loaded or not. Set by `DataTable`. */
    total?: number
  }
}

const CardCellContext = React.createContext(false)

/** True while a cell renders inside a card, where nested interactive elements are not allowed. */
export function useIsCardCell() {
  return React.useContext(CardCellContext)
}

export type DataTableLabels = {
  noResults: string
  /** Count on top of the list, e.g. "50 of 1,284 results": `loaded` records are on screen out of `total`. */
  total: (loaded: number, total: number) => string
  /** Selection count, e.g. "3 selected". Only loaded rows can be selected. */
  selected: (selected: number) => string
  /** Shown at the end of the list when a page fails to load. */
  loadError: string
  retry: string
}

const count = new Intl.NumberFormat("en-US")

export const defaultDataTableLabels: DataTableLabels = {
  noResults: "No results.",
  total: (loaded, total) => `${count.format(loaded)} of ${count.format(total)} ${total === 1 ? "result" : "results"}`,
  selected: (selected) => `${count.format(selected)} selected`,
  loadError: "Couldn't load more.",
  retry: "Retry",
}

type CommonProps<TData> = {
  columns: ColumnDef<TData>[]
  /** Accessible name for the table. */
  label: string
  toolbar?: (table: TanTable<TData>, density: Density, setDensity: (d: Density) => void) => React.ReactNode
  onRowClick?: (row: TData) => void
  /** Stable id of a record. Defaults to its `id` field, else its index. */
  getRowId?: (row: TData) => string
  emptyState?: React.ReactNode
  /** Partial overrides, merged over `defaultDataTableLabels`. */
  labels?: Partial<DataTableLabels>
}

type LocalProps<TData> = {
  /** Every record, filtered and sorted in the browser. For small lists. */
  data: TData[]
  fetchPage?: never
}

type ServerProps<TData> = {
  data?: never
  /** Loads one page at a time by cursor; search, filters and sort run on the server. */
  fetchPage: FetchPage<TData>
}

export type DataTableProps<TData> = CommonProps<TData> & (LocalProps<TData> | ServerProps<TData>)

const defaultRowId = <TData,>(row: TData, index: number) => {
  const id = (row as { id?: unknown }).id
  return id == null ? String(index) : String(id)
}

/** The query as TanStack state, and back. */
function useQueryTableState(query: ListQuery, setQuery: (update: (q: ListQuery) => ListQuery) => void) {
  const sorting = React.useMemo<SortingState>(() => (query.sort ? [query.sort] : []), [query.sort])
  const columnFilters = React.useMemo<ColumnFiltersState>(
    () => Object.entries(query.filters).map(([id, value]) => ({ id, value })),
    [query.filters],
  )
  const onSortingChange: OnChangeFn<SortingState> = (updater) =>
    setQuery((q) => {
      const next = typeof updater === "function" ? updater(q.sort ? [q.sort] : []) : updater
      return { ...q, sort: next[0] ? { id: next[0].id, desc: next[0].desc } : undefined }
    })
  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) =>
    setQuery((q) => {
      const current = Object.entries(q.filters).map(([id, value]) => ({ id, value }))
      const next = typeof updater === "function" ? updater(current) : updater
      const filters: Record<string, string[]> = {}
      for (const f of next) {
        const value = f.value as string[] | undefined
        if (value?.length) filters[f.id] = value
      }
      return { ...q, filters }
    })
  const onGlobalFilterChange: OnChangeFn<string> = (updater) =>
    setQuery((q) => {
      const next = typeof updater === "function" ? updater(q.q ?? "") : updater
      return { ...q, q: next || undefined }
    })
  return { sorting, columnFilters, onSortingChange, onColumnFiltersChange, onGlobalFilterChange }
}

const desktopQuery = "(min-width: 768px)"

/** `null` until hydrated: the server renders both forms and CSS hides one. */
function useIsDesktop() {
  return React.useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(desktopQuery)
      m.addEventListener("change", onChange)
      return () => m.removeEventListener("change", onChange)
    },
    () => window.matchMedia(desktopQuery).matches,
    () => null,
  )
}

/** Rows rendered before hydration, when the visible form is not known yet. */
const unhydratedRows = 20

/** Window-scrolled virtual rows for the element in `ref`. `on: null` renders the first rows without virtualizing. */
function useVirtualRows(
  ref: React.RefObject<HTMLElement | null>,
  count: number,
  estimate: number,
  on: boolean | null,
  getItemKey: (index: number) => string,
) {
  const [margin, setMargin] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el || !on) return
    const update = () => {
      const top = el.getBoundingClientRect().top + window.scrollY
      setMargin((prev) => (Math.abs(prev - top) > 0.5 ? top : prev))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [ref, on])

  const virtualizer = useWindowVirtualizer({
    count,
    estimateSize: () => estimate,
    overscan: 8,
    scrollMargin: margin,
    enabled: !!on,
    getItemKey,
  })

  if (on === null) {
    const items = Array.from({ length: Math.min(count, unhydratedRows) }, (_, index) => ({ index }))
    return { items, before: 0, after: 0, last: -1, measure: undefined }
  }
  const items = on ? virtualizer.getVirtualItems() : []
  const before = items.length ? items[0].start - margin : 0
  const after = items.length ? virtualizer.getTotalSize() - (items[items.length - 1].end - margin) : 0
  return {
    items,
    before: Math.max(0, before),
    after: Math.max(0, after),
    last: items.length ? items[items.length - 1].index : -1,
    measure: virtualizer.measureElement,
  }
}

export function DataTable<TData>(props: DataTableProps<TData>) {
  const { columns, label, toolbar, onRowClick, getRowId, emptyState, labels } = props
  const t = mergeLabels(defaultDataTableLabels, labels)
  const server = !!props.fetchPage
  const columnIds = React.useMemo(
    () => columns.map((c) => c.id ?? (c as { accessorKey?: string }).accessorKey).filter((id): id is string => !!id),
    [columns],
  )
  const [query, setQuery] = useUrlListQuery(columnIds)
  const list = useInfiniteList(props.fetchPage, query)

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [density, setDensity] = React.useState<Density>("comfortable")
  const tableState = useQueryTableState(query, setQuery)

  // Facet counts come from the server; read through a ref so TanStack's cached getters see fresh values.
  const facetsRef = React.useRef(list.facets)
  React.useLayoutEffect(() => {
    facetsRef.current = list.facets
  })

  const data = server ? list.items : (props.data ?? [])
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: tableState.sorting,
      columnFilters: tableState.columnFilters,
      globalFilter: query.q ?? "",
      columnVisibility,
      rowSelection,
    },
    getRowId: getRowId ? (row) => getRowId(row) : defaultRowId,
    enableRowSelection: true,
    manualFiltering: server,
    manualSorting: server,
    onSortingChange: tableState.onSortingChange,
    onColumnFiltersChange: tableState.onColumnFiltersChange,
    onGlobalFilterChange: tableState.onGlobalFilterChange,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: server ? undefined : getFilteredRowModel(),
    getSortedRowModel: server ? undefined : getSortedRowModel(),
    getFacetedRowModel: server ? undefined : getFacetedRowModel(),
    getFacetedUniqueValues: server
      ? (_table, columnId) => () => new Map(Object.entries(facetsRef.current?.[columnId] ?? {}))
      : getFacetedUniqueValues(),
    meta: { total: server ? list.total : undefined },
  })

  const rows = table.getRowModel().rows
  const loaded = rows.length
  const total = server ? list.total : loaded
  const selected = Object.keys(rowSelection).length
  const status = server ? list.status : "idle"

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

  const isDesktop = useIsDesktop()
  const cardsRef = React.useRef<HTMLUListElement>(null)
  const bodyRef = React.useRef<HTMLTableSectionElement>(null)
  const regionRef = React.useRef<HTMLDivElement>(null)
  const rowKey = React.useCallback((index: number) => rows[index]?.id ?? String(index), [rows])
  const rowHeight = density === "compact" ? 33 : 41
  const cards = useVirtualRows(cardsRef, loaded, 72, isDesktop === null ? null : !isDesktop, rowKey)
  const tableRows = useVirtualRows(bodyRef, loaded, rowHeight, isDesktop === null ? null : isDesktop, rowKey)

  // Ask for the next page when the rows on screen get within one screen of the end.
  const visible = isDesktop ? tableRows : cards
  const { fetchNext } = list
  React.useEffect(() => {
    if (!server || visible.last < 0) return
    const screen = Math.ceil(window.innerHeight / (isDesktop ? rowHeight : 72))
    if (visible.last >= loaded - 1 - screen) fetchNext()
  }, [server, visible.last, loaded, isDesktop, rowHeight, fetchNext, list.status])

  // A new query starts at the top of the list.
  const shownKey = list.key
  const previousKey = React.useRef(shownKey)
  React.useEffect(() => {
    if (previousKey.current === shownKey) return
    const hadData = previousKey.current !== ""
    previousKey.current = shownKey
    const region = regionRef.current
    if (!hadData || !region) return
    const top = region.getBoundingClientRect().top + window.scrollY - 16
    if (window.scrollY > top) window.scrollTo({ top })
  }, [shownKey])

  const busy = status === "refreshing" || status === "loading"
  const tail =
    status === "loading" || status === "loading-more"
      ? "skeleton"
      : status === "error"
        ? "error"
        : !loaded
          ? "empty"
          : null
  const skeletonRows = status === "loading" ? 8 : 3
  const retry = (
    <span className="flex flex-wrap items-center justify-center gap-3">
      {t.loadError}
      <Button variant="outline" onClick={list.retry}>
        {t.retry}
      </Button>
    </span>
  )

  return (
    <div ref={regionRef} role="region" aria-label={label} className="flex flex-col gap-3">
      {toolbar?.(table, density, setDensity)}
      <p role="status" className="min-h-5 text-muted-foreground tabular-nums">
        {status === "loading" ? null : (
          <>
            {t.total(loaded, total)}
            {selected > 0 ? ` · ${t.selected(selected)}` : null}
          </>
        )}
      </p>
      <ul
        ref={cardsRef}
        aria-label={label}
        aria-busy={busy || undefined}
        className={cn(
          "flex flex-col overflow-hidden rounded-lg border bg-card transition-opacity md:hidden",
          status === "refreshing" && "opacity-60",
        )}
        style={{ paddingTop: cards.before, paddingBottom: cards.after }}
      >
        {cards.items.map(({ index }) => {
          const row = rows[index]
          if (!row) return null
          return (
            <DataCard
              key={row.id}
              index={index}
              setSize={total}
              measure={cards.measure}
              cells={row.getVisibleCells()}
              slotOf={slotOf}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
            />
          )
        })}
        {tail === "skeleton"
          ? Array.from({ length: skeletonRows }, (_, i) => (
              <li key={`skeleton-${i}`} aria-hidden className="flex flex-col gap-2 border-b px-4 py-3 last:border-b-0">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </li>
            ))
          : null}
        {tail === "error" ? <li className="flex min-h-24 items-center justify-center p-4 text-center">{retry}</li> : null}
        {tail === "empty" ? (
          <li className="flex h-48 items-center justify-center text-center text-muted-foreground">
            {emptyState ?? t.noResults}
          </li>
        ) : null}
      </ul>
      <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
        <Table
          aria-label={label}
          aria-rowcount={total + 1}
          aria-busy={busy || undefined}
          data-density={density}
          className={cn("group/table transition-opacity", status === "refreshing" && "opacity-60")}
        >
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} aria-rowindex={1} className="hover:bg-transparent">
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
          <TableBody ref={bodyRef}>
            {tableRows.before > 0 ? <Spacer height={tableRows.before} colSpan={visibleColumns.length} /> : null}
            {tableRows.items.map(({ index }) => {
              const row = rows[index]
              if (!row) return null
              return (
                <DataRow
                  key={row.id}
                  row={row}
                  index={index}
                  measure={tableRows.measure}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                />
              )
            })}
            {tableRows.after > 0 ? <Spacer height={tableRows.after} colSpan={visibleColumns.length} /> : null}
            {tail === "skeleton"
              ? Array.from({ length: skeletonRows }, (_, i) => (
                  <TableRow key={`skeleton-${i}`} aria-hidden className="hover:bg-transparent">
                    <TableCell colSpan={visibleColumns.length} className="h-10">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : null}
            {tail === "error" ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                  {retry}
                </TableCell>
              </TableRow>
            ) : null}
            {tail === "empty" ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={visibleColumns.length} className="h-48 text-center text-muted-foreground">
                  {emptyState ?? t.noResults}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function Spacer({ height, colSpan }: { height: number; colSpan: number }) {
  return (
    <tr aria-hidden style={{ height }}>
      <td colSpan={colSpan} className="p-0" />
    </tr>
  )
}

function DataRow<TData>({
  row,
  index,
  measure,
  onClick,
}: {
  row: Row<TData>
  index: number
  measure?: (el: Element | null) => void
  onClick?: () => void
}) {
  return (
    <TableRow
      ref={measure}
      data-index={index}
      aria-rowindex={index + 2}
      data-state={row.getIsSelected() ? "selected" : undefined}
      onClick={onClick}
      className={cn(onClick && "cursor-pointer")}
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
  )
}

function DataCard<TData>({
  cells,
  index,
  setSize,
  measure,
  slotOf,
  onClick,
}: {
  cells: Cell<TData, unknown>[]
  index: number
  setSize: number
  measure?: (el: Element | null) => void
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
    <li
      ref={measure}
      data-index={index}
      aria-setsize={setSize}
      aria-posinset={index + 1}
      className="border-b last:border-b-0"
    >
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
