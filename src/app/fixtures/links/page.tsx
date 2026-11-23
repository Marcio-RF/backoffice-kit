import type { Metadata } from "next"
import Link from "next/link"

// Test-only page: client links to six different Orders queries, for the list cache.
export const metadata: Metadata = { title: "Fixtures: links", robots: { index: false } }

const queries = [
  "status=pending",
  "status=confirmed",
  "status=in_progress",
  "status=completed",
  "status=cancelled",
  "channel=Phone",
]

export default function FixtureLinksPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-2 p-4">
      <h1 className="text-xl font-semibold">Fixtures de links</h1>
      <ul className="flex flex-col gap-2">
        {queries.map((q) => (
          <li key={q}>
            <Link href={`/orders?${q}`} className="underline">
              {q}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
