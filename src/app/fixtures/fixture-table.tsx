"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { DataTable } from "@/components/data-table/data-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

type Row = { name: string }

const data: Row[] = ["Ana", "Bruno", "Carla", "Diogo", "Eva", "Filipe", "Graça", "Hugo"].map((name) => ({ name }))

const columns: ColumnDef<Row>[] = [
  {
    id: "select",
    header: () => null,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label={`Selecionar ${row.original.name}`}
      />
    ),
  },
  { accessorKey: "name", header: "Nome" },
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
      toolbar={(table) => (
        <Input
          type="search"
          aria-label="Pesquisar"
          value={(table.getState().globalFilter as string) ?? ""}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
        />
      )}
    />
  )
}
