"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { type ListQuery, queryKey } from "@/components/data-table/list-source"

/**
 * The URL is the only source of a list's search, filters and sort:
 * `q=<text>`, one `<columnId>=<value>,<value>` per filtered column, and `sort=<columnId>.asc|desc`.
 */
export function parseListQuery(params: URLSearchParams, columnIds: readonly string[]): ListQuery {
  const filters: Record<string, string[]> = {}
  for (const id of columnIds) {
    const raw = params.get(id)
    if (raw) filters[id] = raw.split(",").filter(Boolean)
  }
  const sortRaw = params.get("sort")
  const match = sortRaw?.match(/^(.+)\.(asc|desc)$/)
  return {
    q: params.get("q") || undefined,
    filters,
    sort: match && columnIds.includes(match[1]) ? { id: match[1], desc: match[2] === "desc" } : undefined,
  }
}

/** Writes `query` over `params`, keeping parameters that are not the list's. */
export function writeListQuery(params: URLSearchParams, query: ListQuery, columnIds: readonly string[]) {
  const next = new URLSearchParams(params)
  for (const id of [...columnIds, "q", "sort"]) next.delete(id)
  if (query.q) next.set("q", query.q)
  for (const [id, values] of Object.entries(query.filters)) if (values.length) next.set(id, values.join(","))
  if (query.sort) next.set("sort", `${query.sort.id}.${query.sort.desc ? "desc" : "asc"}`)
  return next
}

/**
 * The list's query, read from and written to the URL with `router.replace` (no new history entries).
 * Only the list's own path counts: while a Dialog roteado is open the URL is the dialog's, and the list
 * keeps its query.
 */
export function useUrlListQuery(columnIds: readonly string[]) {
  const router = useRouter()
  const pathname = usePathname()
  const [listPath] = React.useState(pathname)
  const searchParams = useSearchParams()
  const idsKey = columnIds.join("|")
  const fromUrl = React.useMemo(
    () => parseListQuery(new URLSearchParams(searchParams.toString()), idsKey.split("|")),
    [searchParams, idsKey],
  )
  // A local copy answers at once; the URL catches up after `router.replace`.
  const [query, setLocal] = React.useState(fromUrl)
  // Key of the last URL this hook took in, and the keys of our own replaces still on their way.
  const [seen, setSeen] = React.useState(queryKey(fromUrl))
  const [pending, setPending] = React.useState<string[]>([])
  const urlKey = queryKey(fromUrl)
  if (pathname === listPath && urlKey !== seen) {
    setSeen(urlKey)
    const mine = pending.indexOf(urlKey)
    if (mine >= 0) {
      // One of our own replaces landed; a later one may still be on its way.
      setPending(pending.slice(mine + 1))
    } else {
      // The URL changed from outside (back, a link): it wins.
      setPending([])
      setLocal(fromUrl)
    }
  }

  const queryRef = React.useRef(query)
  React.useLayoutEffect(() => {
    queryRef.current = query
  })

  const setQuery = React.useCallback(
    (update: (q: ListQuery) => ListQuery) => {
      const next = update(queryRef.current)
      if (queryKey(next) === queryKey(queryRef.current)) return
      queryRef.current = next
      setLocal(next)
      setPending((p) => [...p, queryKey(next)])
      const params = writeListQuery(new URLSearchParams(window.location.search), next, idsKey.split("|")).toString()
      router.replace(params ? `${listPath}?${params}` : listPath, { scroll: false })
    },
    [router, listPath, idsKey],
  )

  return [query, setQuery] as const
}
