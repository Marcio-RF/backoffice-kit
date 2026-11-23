"use client"

import { type FetchItem, type InfiniteListState, type ListQuery, applyItemUpdate, queryKey } from "@/components/data-table/list-source"
import { subscribeItemUpdates } from "@/components/data-table/list-updates"

/** Where the list was on screen: the first visible record and how far its top was from the top of the viewport. */
export type ListPosition = { index: number; offset: number }

type Entry = {
  /** `null` when the list had more records than the cache keeps: only the position is restored. */
  state: InfiniteListState<unknown> | null
  position: ListPosition | null
  savedAt: number
  resource?: string
  query: ListQuery
  fetchItem?: FetchItem<unknown>
  idOf: (item: unknown) => string
}

/** The session cache keeps few lists, for a short time, and only so many records each. */
export const listCacheLimits = { lists: 5, maxAgeMs: 10 * 60 * 1000, maxItems: 1000 }

// Map keeps insertion order: the first entry is the least recently left.
const entries = new Map<string, Entry>()
let subscribed = false

/** The cache key of a list: its path and its query. */
export function listCacheKey(path: string, query: ListQuery) {
  return `${path}?${queryKey(query)}`
}

/** A list leaving the screen (the sidebar, a link) keeps its pages, marks and position here. */
export function saveList<TData>(
  key: string,
  entry: {
    state: InfiniteListState<TData>
    position: ListPosition | null
    resource?: string
    query: ListQuery
    fetchItem?: FetchItem<TData>
    idOf: (item: TData) => string
  },
) {
  if (!subscribed) {
    subscribed = true
    // Records changed while their list is away are fetched again and updated in the cache too.
    subscribeItemUpdates(async (updates) => {
      for (const update of updates) {
        for (const cached of entries.values()) {
          if (!cached.state || cached.resource !== update.resource || !cached.fetchItem) continue
          const result = await cached.fetchItem(update.id, cached.query).catch(() => undefined)
          if (result === undefined || !cached.state) continue
          cached.state = applyItemUpdate(cached.state, update, result, cached.idOf)
        }
      }
    })
  }
  const { state } = entry
  const keep = state.items.length <= listCacheLimits.maxItems
  entries.delete(key)
  entries.set(key, {
    state: keep ? { ...(state as InfiniteListState<unknown>), status: "idle" } : null,
    position: entry.position,
    savedAt: Date.now(),
    resource: entry.resource,
    query: entry.query,
    fetchItem: entry.fetchItem as FetchItem<unknown> | undefined,
    idOf: entry.idOf as (item: unknown) => string,
  })
  while (entries.size > listCacheLimits.lists) entries.delete(entries.keys().next().value!)
}

/** Takes a list back out of the cache when it mounts again; nothing when it is missing or too old. */
export function takeList<TData>(key: string) {
  const entry = entries.get(key)
  entries.delete(key)
  if (!entry || Date.now() - entry.savedAt > listCacheLimits.maxAgeMs) return undefined
  return { state: entry.state as InfiniteListState<TData> | null, position: entry.position }
}

