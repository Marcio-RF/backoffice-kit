"use client"

import type { Column, Table } from "@tanstack/react-table"
import { Columns3, Rows3, Rows4, Search, SlidersHorizontal, X } from "lucide-react"
import * as React from "react"

import type { Density } from "@/components/data-table/data-table"
import { FacetedFilter, type FacetedFilterLabels } from "@/components/data-table/faceted-filter"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { mergeLabels } from "@/lib/labels"

export type DataTableToolbarLabels = {
  /** Title of the panel and of the button that opens it on the Celular. */
  filters: string
  /** Text of the button that opens the panel; `active` is the number of facets with a filter. */
  filtersButton: (active: number) => string
  /** Clears the search and the filters from the toolbar (from md up). */
  reset: string
  /** Clears the filters and the sort from the panel. */
  clear: string
  /** Primary button in the panel footer; `count` is the number of matching rows. */
  showResults: (count: number) => string
  sortBy: string
  ascending: string
  descending: string
  density: string
  comfortable: string
  compact: string
  columns: string
  toggleColumns: string
}

export const defaultDataTableToolbarLabels: DataTableToolbarLabels = {
  filters: "Filters",
  filtersButton: (active) => (active > 0 ? `Filters (${active})` : "Filters"),
  reset: "Reset",
  clear: "Clear",
  showResults: (count) => `View ${count} ${count === 1 ? "result" : "results"}`,
  sortBy: "Sort by",
  ascending: "Ascending",
  descending: "Descending",
  density: "Row density",
  comfortable: "Comfortable rows",
  compact: "Compact rows",
  columns: "Columns",
  toggleColumns: "Toggle columns",
}

export type FacetFilter = {
  /** Column id. */
  column: string
  title: string
  options: { label: string; value: string }[]
}

type DataTableToolbarProps<TData> = {
  table: Table<TData>
  density: Density
  onDensityChange: (density: Density) => void
  search: { label: string; placeholder?: string }
  filters?: FacetFilter[]
  /** Column ids offered in "Sort by". Defaults to every column that can be sorted. */
  sortColumns?: string[]
  /** Partial overrides, merged over `defaultDataTableToolbarLabels`. */
  labels?: Partial<DataTableToolbarLabels>
  /** Partial overrides for the filter chips. */
  filterLabels?: Partial<FacetedFilterLabels>
}

/** Title of a column in menus: `meta.title`, else a plain-string header, else the id. */
function columnTitle<TData>(column: Column<TData, unknown>) {
  const header = column.columnDef.header
  return column.columnDef.meta?.title ?? (typeof header === "string" ? header : column.id)
}

export function DataTableToolbar<TData>({
  table,
  density,
  onDensityChange,
  search,
  filters = [],
  sortColumns,
  labels,
  filterLabels,
}: DataTableToolbarProps<TData>) {
  const t = mergeLabels(defaultDataTableToolbarLabels, labels)
  const [open, setOpen] = React.useState(false)
  const state = table.getState()
  const active = filters.filter((f) => {
    const value = table.getColumn(f.column)?.getFilterValue() as unknown[] | undefined
    return !!value?.length
  }).length
  const dirty = state.columnFilters.length > 0 || !!state.globalFilter
  const sortable = (
    sortColumns
      ? sortColumns.map((id) => table.getColumn(id))
      : table.getAllLeafColumns().filter((c) => c.accessorFn && c.getCanSort())
  ).filter((c): c is Column<TData, unknown> => !!c)
  const sort = state.sorting[0]
  const results = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1 md:flex-none">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label={search.label}
          placeholder={search.placeholder}
          value={(state.globalFilter as string) ?? ""}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          className="w-full pl-8 md:w-56 lg:w-72"
        />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="md:hidden">
            <SlidersHorizontal aria-hidden />
            {t.filtersButton(active)}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-describedby={undefined}
          className="max-h-[85dvh] gap-0 rounded-t-xl"
        >
          <SheetHeader className="border-b">
            <SheetTitle>{t.filters}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 overflow-y-auto p-4">
            {filters.map((f) => (
              <FacetSection key={f.column} filter={f} column={table.getColumn(f.column)} />
            ))}
            {sortable.length ? (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 font-medium">{t.sortBy}</legend>
                <RadioGroup
                  aria-label={t.sortBy}
                  value={sort?.id ?? ""}
                  onValueChange={(id) => table.setSorting([{ id, desc: sort?.desc ?? false }])}
                >
                  {sortable.map((c) => (
                    <Label key={c.id} className="min-h-11 gap-3">
                      <RadioGroupItem value={c.id} />
                      {columnTitle(c)}
                    </Label>
                  ))}
                </RadioGroup>
                <RadioGroup
                  aria-label={`${t.sortBy}: ${t.ascending} / ${t.descending}`}
                  value={sort ? (sort.desc ? "desc" : "asc") : ""}
                  disabled={!sort}
                  onValueChange={(dir) => sort && table.setSorting([{ id: sort.id, desc: dir === "desc" }])}
                  className="grid-cols-2"
                >
                  <Label className="min-h-11 gap-3">
                    <RadioGroupItem value="asc" />
                    {t.ascending}
                  </Label>
                  <Label className="min-h-11 gap-3">
                    <RadioGroupItem value="desc" />
                    {t.descending}
                  </Label>
                </RadioGroup>
              </fieldset>
            ) : null}
          </div>
          <SheetFooter className="flex-row border-t pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Button
              variant="outline"
              onClick={() => {
                table.resetColumnFilters()
                table.resetSorting()
              }}
            >
              {t.clear}
            </Button>
            <Button className="flex-1" onClick={() => setOpen(false)}>
              {t.showResults(results)}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <div className="hidden items-center gap-2 md:contents">
        {filters.map((f) => (
          <FacetedFilter
            key={f.column}
            column={table.getColumn(f.column)}
            title={f.title}
            options={f.options}
            labels={filterLabels}
          />
        ))}
        {dirty ? (
          <Button
            variant="ghost"
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter("")
            }}
          >
            {t.reset}
            <X aria-hidden />
          </Button>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            value={density}
            onValueChange={(v) => v && onDensityChange(v as Density)}
            aria-label={t.density}
          >
            <ToggleGroupItem value="comfortable" aria-label={t.comfortable}>
              <Rows3 />
            </ToggleGroupItem>
            <ToggleGroupItem value="compact" aria-label={t.compact}>
              <Rows4 />
            </ToggleGroupItem>
          </ToggleGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3 aria-hidden />
                {t.columns}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs text-muted-foreground">{t.toggleColumns}</DropdownMenuLabel>
              {table
                .getAllColumns()
                .filter((c) => c.getCanHide())
                .map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.id}
                    checked={c.getIsVisible()}
                    onCheckedChange={(v) => c.toggleVisibility(!!v)}
                  >
                    {columnTitle(c)}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function FacetSection<TData>({ filter, column }: { filter: FacetFilter; column?: Column<TData, unknown> }) {
  const facets = column?.getFacetedUniqueValues()
  const selected = new Set((column?.getFilterValue() as string[] | undefined) ?? [])

  const toggle = (value: string, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(value)
    else next.delete(value)
    column?.setFilterValue(next.size ? Array.from(next) : undefined)
  }

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 font-medium">{filter.title}</legend>
      {filter.options.map((o) => (
        <Label key={o.value} className="min-h-11 gap-3">
          <Checkbox checked={selected.has(o.value)} onCheckedChange={(v) => toggle(o.value, v === true)} />
          <span className="flex-1">{o.label}</span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{facets?.get(o.value) ?? 0}</span>
        </Label>
      ))}
    </fieldset>
  )
}
