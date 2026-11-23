"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { multiValueFilter } from "@/components/data-table/faceted-filter"
import type { FetchPage } from "@/components/data-table/list-source"
import { Checkbox } from "@/components/ui/checkbox"

type Row = { name: string; city: string }

const cities = ["Lisboa", "Porto", "Faro", "Braga"]
const data: Row[] = ["Ana", "Bruno", "Carla", "Diogo", "Eva", "Filipe", "Graça", "Hugo"].map((name, i) => ({
  name,
  city: cities[i % cities.length],
}))

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
  { accessorKey: "city", header: "Cidade", meta: { mobile: "subtitle" }, filterFn: multiValueFilter },
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
      labels={{
        noResults: "Sem resultados.",
        total: (loaded, total) => `${loaded} de ${total} pessoas`,
        selected: (selected) => `${selected} selecionados`,
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
            ascending: "Ascendente",
            descending: "Descendente",
            reset: "Repor",
            density: "Densidade das linhas",
            comfortable: "Linhas confortáveis",
            compact: "Linhas compactas",
            columns: "Colunas",
            toggleColumns: "Mostrar colunas",
          }}
          filterLabels={{ selected: (n) => `${n} selecionados`, noResults: "Sem resultados.", clear: "Limpar filtro" }}
        />
      )}
    />
  )
}

export function FixtureTableWithoutSlots() {
  return <DataTable label="Pessoas sem slots" columns={columnsWithoutSlots} data={data} />
}

type Numbered = { id: string; name: string }

const numbered: Numbered[] = Array.from({ length: 300 }, (_, i) => ({ id: String(i + 1), name: `Registo ${i + 1}` }))
const numberedColumns: ColumnDef<Numbered>[] = [{ accessorKey: "name", header: "Nome", meta: { mobile: "title" } }]

// The third page fails once, so the test can see the error and the retry.
let failedOnce = false
const fetchNumbered: FetchPage<Numbered> = async ({ cursor }) => {
  await new Promise((r) => setTimeout(r, 50))
  const start = cursor ? Number(cursor) : 0
  if (start === 80 && !failedOnce) {
    failedOnce = true
    throw new Error("Simulated failure")
  }
  const next = start + 40
  return { items: numbered.slice(start, next), nextCursor: next < numbered.length ? String(next) : null, total: numbered.length }
}

export function FixtureServerTable() {
  return (
    <DataTable
      label="Registos"
      columns={numberedColumns}
      fetchPage={fetchNumbered}
      labels={{
        total: (loaded, total) => `${loaded} de ${total} registos`,
        loadError: "Não foi possível carregar mais.",
        // Explicitly `undefined`: the default must survive.
        retry: undefined,
      }}
    />
  )
}
