"use client"

import * as React from "react"

/** What the server filters, searches and sorts by. The same shape lives in the URL. */
export type ListQuery = {
  q?: string
  /** Selected values per column id. */
  filters: Record<string, string[]>
  sort?: { id: string; desc: boolean }
}

/** Counts per option, per column id, for the Filters. */
export type ListFacets = Record<string, Record<string, number>>

export type ListPage<TData> = {
  items: TData[]
  /** `null` when there is nothing after this page. */
  nextCursor: string | null
  /** Every record that matches the query, not only the loaded ones. */
  total: number
  facets?: ListFacets
}

/** Fetches one page; `cursor` is `null` for the first page. */
export type FetchPage<TData> = (args: { cursor: string | null; query: ListQuery }) => Promise<ListPage<TData>>

/** Fetches one record again; `matches` says whether it still matches `query`. `null` means it was deleted. */
export type FetchItem<TData> = (id: string, query: ListQuery) => Promise<{ item: TData; matches: boolean } | null>

export const emptyQuery: ListQuery = { filters: {} }

/** Stable string for a query: same filters in any order give the same key. */
export function queryKey(query: ListQuery): string {
  const filters = Object.keys(query.filters)
    .filter((k) => query.filters[k]?.length)
    .sort()
    .map((k) => `${k}=${[...query.filters[k]].sort().join(",")}`)
  return JSON.stringify([query.q ?? "", filters, query.sort ? `${query.sort.id}.${query.sort.desc ? "desc" : "asc"}` : ""])
}

export type ListStatus =
  /** First page in flight and nothing to show yet. */
  | "loading"
  /** The query changed: the rows on screen are from the previous query. */
  | "refreshing"
  | "loading-more"
  | "error"
  | "idle"

/**
 * How a record changed since its page loaded: created here (`new`), edited so it no longer matches the
 * query (`stale`), or `deleted`. Marks stay until the next search, filter or sort.
 */
export type ItemMark = "new" | "stale" | "deleted"

export type InfiniteListState<TData> = {
  items: TData[]
  marks: Record<string, ItemMark>
  nextCursor: string | null
  total: number
  facets?: ListFacets
  status: ListStatus
  /** Key of the query the items belong to. */
  key: string
}

/**
 * Loads pages of `fetchPage` one after another. When `query` changes, the pages start over:
 * the old rows stay (status `refreshing`) until the first page of the new query arrives.
 */
export function useInfiniteList<TData>(
  fetchPage: FetchPage<TData> | undefined,
  query: ListQuery,
  initial?: InfiniteListState<TData>,
) {
  const key = queryKey(query)
  const [state, setState] = React.useState<InfiniteListState<TData>>(
    () =>
      initial ?? { items: [], marks: {}, nextCursor: null, total: 0, status: fetchPage ? "loading" : "idle", key: "" },
  )
  // Every request carries a token; a response whose token is stale is dropped.
  const token = React.useRef(0)
  const queryRef = React.useRef(query)
  const fetchRef = React.useRef(fetchPage)
  const stateRef = React.useRef(state)
  React.useLayoutEffect(() => {
    queryRef.current = query
    fetchRef.current = fetchPage
    stateRef.current = state
  })

  const load = React.useCallback((cursor: string | null, forKey: string) => {
    const fetcher = fetchRef.current
    if (!fetcher) return
    const mine = ++token.current
    setState((s) => ({
      ...s,
      status: cursor ? "loading-more" : s.items.length ? "refreshing" : "loading",
    }))
    fetcher({ cursor, query: queryRef.current }).then(
      (page) => {
        if (mine !== token.current) return
        setState((s) => ({
          items: cursor ? [...s.items, ...page.items] : page.items,
          marks: cursor ? s.marks : {},
          nextCursor: page.nextCursor,
          total: page.total,
          facets: page.facets ?? (cursor ? s.facets : undefined),
          status: "idle",
          key: forKey,
        }))
      },
      () => {
        if (mine !== token.current) return
        setState((s) => ({ ...s, status: "error" }))
      },
    )
  }, [])

  // A new query (or the first render without data for it) starts over from the first page.
  React.useEffect(() => {
    if (!fetchRef.current || state.key === key) return
    load(null, key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, load])

  const fetchNext = React.useCallback(() => {
    const s = stateRef.current
    if (s.status !== "idle" || !s.nextCursor) return
    stateRef.current = { ...s, status: "loading-more" }
    load(s.nextCursor, s.key)
  }, [load])

  /** After an error: repeats the request that failed. */
  const retry = React.useCallback(() => {
    const s = stateRef.current
    if (s.status !== "error") return
    load(s.key === key && s.items.length ? s.nextCursor : null, key)
  }, [key, load])

  return { ...state, fetchNext, retry, setState }
}

/**
 * Applies a record fetched again to the loaded pages: replaced in place (marked `stale` when it no
 * longer matches), marked `deleted` when gone, or added on top as `new` when created and matching.
 */
export function applyItemUpdate<TData>(
  state: InfiniteListState<TData>,
  update: { id: string; kind: "changed" | "created" },
  result: { item: TData; matches: boolean } | null,
  idOf: (item: TData) => string,
): InfiniteListState<TData> {
  const index = state.items.findIndex((item) => idOf(item) === update.id)
  const marks = { ...state.marks }
  if (update.kind === "created") {
    if (!result || !result.matches || index >= 0) return state
    marks[update.id] = "new"
    return { ...state, items: [result.item, ...state.items], total: state.total + 1, marks }
  }
  if (index < 0) return state
  if (!result) {
    marks[update.id] = "deleted"
    return { ...state, marks }
  }
  const items = state.items.slice()
  items[index] = result.item
  if (!result.matches) marks[update.id] = "stale"
  else if (marks[update.id] !== "new") delete marks[update.id]
  return { ...state, items, marks }
}
