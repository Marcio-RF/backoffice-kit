/**
 * The contract between a list and the Dialog roteado opened from it. Shared by `@backoffice/data-table`
 * and `@backoffice/routed-dialog`, so neither block imports the other.
 */

/** Fired on `window` when a Dialog roteado opens or closes. */
export const routedDialogEvent = "backoffice:routed-dialog"

export type RoutedDialogEventDetail = {
  type: "open" | "close"
  /** Path the dialog was opened at, e.g. `/orders/ORD-1`: the href of the row or card it came from. */
  origin: string
}

export function dispatchRoutedDialogEvent(detail: RoutedDialogEventDetail) {
  window.dispatchEvent(new CustomEvent<RoutedDialogEventDetail>(routedDialogEvent, { detail }))
}

/** True while a Dialog roteado is on screen. */
export function isRoutedDialogOpen() {
  return typeof document !== "undefined" && !!document.querySelector("[data-slot='routed-dialog']")
}

/** View Transition name shared by a row or card and the dialog opened from it. */
export function routedTransitionName(href: string) {
  return `routed-${href.replace(/[^a-zA-Z0-9_-]/g, "_")}`
}
