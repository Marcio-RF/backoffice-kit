"use client"

import { isRoutedDialogOpen, type RoutedDialogEventDetail, routedDialogEvent } from "@/lib/routed"

/** A record that changed somewhere else (a Dialog roteado, an action), to be fetched again by the lists that show it. */
export type ItemUpdate = { resource: string; id: string; kind: "changed" | "created" }

const queue: ItemUpdate[] = []
const listeners = new Set<(updates: ItemUpdate[]) => void>()
let listening = false

function flush() {
  if (!queue.length) return
  const updates = queue.splice(0)
  for (const listener of listeners) listener(updates)
}

function schedule() {
  if (!listening) {
    listening = true
    window.addEventListener(routedDialogEvent, (e) => {
      if ((e as CustomEvent<RoutedDialogEventDetail>).detail.type === "close") flush()
    })
  }
  // With a Dialog roteado open, the list behind waits until it closes, so nothing moves under the user.
  if (!isRoutedDialogOpen()) queueMicrotask(flush)
}

/**
 * Tells every list of `resource` that a record changed (edited, deleted). When the Dialog roteado
 * closes, they fetch that record again with `fetchItem` and update it in place.
 */
export function markItemChanged(resource: string, id: string) {
  queue.push({ resource, id, kind: "changed" })
  schedule()
}

/** Tells every list of `resource` that a record was created: it shows on top, marked as new, if it matches. */
export function markItemCreated(resource: string, id: string) {
  queue.push({ resource, id, kind: "created" })
  schedule()
}

/** For `DataTable`: called with the updates when they are due. */
export function subscribeItemUpdates(listener: (updates: ItemUpdate[]) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
