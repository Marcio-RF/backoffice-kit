import type { Metadata } from "next"
import { Suspense } from "react"

import { FixtureServerTable, FixtureTable, FixtureTableWithoutSlots } from "./fixture-table"

// Test-only page: not in the navigation and not in registry.json.
export const metadata: Metadata = { title: "Fixtures", robots: { index: false } }

export default function FixturesPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Fixtures de Rótulos</h1>
      <Suspense>
        <FixtureTable />
        <FixtureTableWithoutSlots />
        <FixtureServerTable />
      </Suspense>
    </main>
  )
}
