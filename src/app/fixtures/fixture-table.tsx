"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { Checkbox } from "@/components/ui/checkbox"

type Row = { name: string; city: string }

const cities = ["Lisboa", "Porto", "Faro", "Braga"]
const data: Row[] = ["Ana", "Bruno", "Carla", "Diogo", "Eva", "Filipe", "Graça", "Hugo"].map((name, i) => ({
  name,
  city: cities[i % cities.length],
}))

const multi = (row: { getValue: (id: string) => unknown }, id: string, value: string[]) =>
  value.includes(row.getValue(id) as string)

const select: ColumnDef<Row> = {
  id: "select",
  header: () => null,
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(v) => row.toggleSelected(!!v)}
      aria-label={`Selecionar ${row.original.name}`}
    />
  ),
}

const columns: ColumnDef<Row>[] = [
  select,
  { accessorKey: "name", header: "Nome", meta: { mobile: "title" } },
  { accessorKey: "city", header: "Cidade", meta: { mobile: "subtitle" }, filterFn: multi },
]

// No column declares a card slot: the first column with data becomes the title.
const columnsWithoutSlots: ColumnDef<Row>[] = [
  select,
  { accessorKey: "name", header: "Nome" },
  { accessorKey: "city", header: "Cidade" },
]

export function FixtureTable() {
  return (
    <DataTable
      label="Pessoas"
      columns={columns}
      data={data}
      pageSize={3}
      // `nextPage` is explicitly `undefined`: the default must survive.
      labels={{
        nextPage: undefined,
        noResults: "Sem resultados.",
        previousPage: "Página anterior",
        range: (from, to, total) => `${from}–${to} de ${total}`,
        selected: (selected, total) => `${selected} de ${total} selecionados`,
      }}
      toolbar={(table, density, setDensity) => (
        <DataTableToolbar
          table={table}
          density={density}
          onDensityChange={setDensity}
          search={{ label: "Pesquisar" }}
          filters={[{ column: "city", title: "Cidade", options: cities.map((c) => ({ value: c, label: c })) }]}
          labels={{
            filters: "Filtros",
            filtersButton: (n) => (n > 0 ? `Filtros (${n})` : "Filtros"),
            showResults: (n) => `Ver ${n} resultados`,
            clear: "Limpar",
            sortBy: "Ordenar por",
          }}
        />
      )}
    />
  )
}

export function FixtureTableWithoutSlots() {
  return <DataTable label="Pessoas sem slots" columns={columnsWithoutSlots} data={data} pageSize={3} />
}
