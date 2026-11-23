"use client"

import { ArrowLeft, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSelectedLayoutSegment } from "next/navigation"
import * as React from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { mergeLabels } from "@/lib/labels"
import { dispatchRoutedDialogEvent, routedTransitionName } from "@/lib/routed"
import { cn } from "@/lib/utils"

export type RoutedDialogLabels = {
  /** Accessible name of the × in the header. */
  close: string
  /** Accessible name of the ← in the header, shown after navigating inside the dialog. */
  back: string
  /** Asked before closing with unsaved changes. */
  discardTitle: string
  discardDescription: string
  discardConfirm: string
  discardCancel: string
}

export const defaultRoutedDialogLabels: RoutedDialogLabels = {
  close: "Close",
  back: "Back",
  discardTitle: "Discard changes?",
  discardDescription: "Your changes haven't been saved and will be lost.",
  discardConfirm: "Discard",
  discardCancel: "Keep editing",
}

export type LeaveOptions = {
  /** Skip the "Discard changes?" question, e.g. right after saving. */
  force?: boolean
  /** Fetch the page it goes back to again, e.g. the Detail after editing it. */
  refresh?: boolean
}

type Frame = {
  mode: "dialog" | "page"
  labels: RoutedDialogLabels
  titleId: string
  /** Steps taken inside the dialog; 1 right after opening. */
  depth: number
  /** One step back (the ←). */
  back: (options?: LeaveOptions) => void
  /** Back to the list, however many steps were taken (×, Esc, swipe down, click outside). */
  close: (options?: LeaveOptions) => void
  /** Where ← goes on the full page. */
  backHref?: string
  setDirty: (dirty: boolean) => void
}

const noop = () => {}
const FrameContext = React.createContext<Frame>({
  mode: "page",
  labels: defaultRoutedDialogLabels,
  titleId: "",
  depth: 1,
  back: noop,
  close: noop,
  setDirty: noop,
})

/** The frame around the content: dialog or full page, its navigation and its Rótulos. */
export function useRoutedDialog() {
  const { mode, depth, back, close, labels } = React.useContext(FrameContext)
  return { mode, depth, back, close, labels }
}

/**
 * Tells the frame the content has unsaved changes: closing or going back then asks first, and a
 * reload or closing the tab shows the browser's own warning.
 */
export function useRoutedDialogDirty(dirty: boolean) {
  const { setDirty } = React.useContext(FrameContext)
  React.useEffect(() => {
    setDirty(dirty)
    return () => setDirty(false)
  }, [dirty, setDirty])
}

const desktopQuery = "(min-width: 768px)"

/** Index of the current history entry, where the Navigation API exists. */
function navigationIndex(): number | null {
  const nav = (window as Window & { navigation?: { currentEntry?: { index: number } | null } }).navigation
  const index = nav?.currentEntry?.index
  return typeof index === "number" && index >= 0 ? index : null
}
const editable =
  "input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]), [data-slot='select-trigger']:not([disabled])"

/**
 * The Dialog roteado. Goes in the layout of the `@modal` slot and stays mounted while the content
 * inside it changes, so navigating from a record to another swaps only the content.
 * It opens when the slot shows an intercepted route (`(.)orders/[id]`…) and closes on anything else
 * (`default.tsx`, the catch-all).
 */
export function RoutedDialogHost(props: {
  children: React.ReactNode
  /** Partial overrides, merged over `defaultRoutedDialogLabels`. */
  labels?: Partial<RoutedDialogLabels>
}) {
  // The URL is known only at request time: the prerendered shell has no dialog.
  return (
    <React.Suspense fallback={null}>
      <Host {...props} />
    </React.Suspense>
  )
}

function Host({
  children,
  labels,
}: {
  children: React.ReactNode
  labels?: Partial<RoutedDialogLabels>
}) {
  const t = React.useMemo(() => mergeLabels(defaultRoutedDialogLabels, labels), [labels])
  const segment = useSelectedLayoutSegment()
  const pathname = usePathname()
  // Intercepted routes start with a marker like `(.)`; default.tsx, page.tsx and the catch-all don't.
  const open = !!segment && segment.startsWith("(")

  // Where the dialog was opened: the href of the row or card it zooms out of.
  const [origin, setOrigin] = React.useState<string | null>(null)
  if (open && origin === null) setOrigin(pathname)
  if (!open && origin !== null) setOrigin(null)
  const originNow = open ? (origin ?? pathname) : null

  // How many history entries the dialog is deep, to know how far back the list is. The Navigation API
  // gives the entry index; without it, the visited paths are a good guess.
  const [steps, setSteps] = React.useState<string[]>([])
  const openIndex = React.useRef<number | null>(null)
  React.useEffect(() => {
    const index = navigationIndex()
    setSteps((s) => {
      if (!open) {
        openIndex.current = null
        return []
      }
      if (index !== null) {
        openIndex.current ??= index
        const depth = Math.max(1, index - openIndex.current + 1)
        return Array.from({ length: depth }, (_, i) => (i === depth - 1 ? pathname : (s[i] ?? "")))
      }
      if (!s.length) return [pathname]
      if (s[s.length - 1] === pathname) return s
      if (s[s.length - 2] === pathname) return s.slice(0, -1)
      return [...s, pathname]
    })
  }, [open, pathname])
  const depth = Math.max(1, steps.length)

  // Unsaved changes: a spare history entry catches the browser's back while we ask.
  const [dirty, setDirtyState] = React.useState(false)
  const guarded = React.useRef(false)
  const [asking, setAsking] = React.useState<null | { then: () => void; restoreGuard: boolean }>(null)
  // Read through a ref too: an Esc right after typing must already see the form as changed.
  const dirtyRef = React.useRef(false)
  const setDirty = React.useCallback((value: boolean) => {
    dirtyRef.current = value
    setDirtyState(value)
  }, [])

  const router = useRouter()
  const leave = React.useCallback(
    (stepsBack: number, refresh = false) => {
      const extra = guarded.current ? 1 : 0
      guarded.current = false
      setDirty(false)
      void goBackAnimated(stepsBack + extra, stepsBack >= depth, originNow).then(() => {
        if (refresh) router.refresh()
      })
    },
    [depth, originNow, router, setDirty],
  )

  const guard = React.useCallback(
    (then: () => void, force?: boolean) => {
      if (dirtyRef.current && !force) setAsking({ then, restoreGuard: false })
      else then()
    },
    [],
  )

  const back = React.useCallback(
    (options?: LeaveOptions) => guard(() => leave(1, options?.refresh), options?.force),
    [guard, leave],
  )
  const close = React.useCallback(
    (options?: LeaveOptions) => guard(() => leave(depth, options?.refresh), options?.force),
    [guard, leave, depth],
  )

  React.useEffect(() => {
    if (!open || !dirty || guarded.current) return
    window.history.pushState(window.history.state, "", window.location.href)
    guarded.current = true
  }, [open, dirty])

  React.useEffect(() => {
    if (!open) return
    const onPop = () => {
      // The browser's back used up the spare entry: stay, and ask.
      if (guarded.current && dirty) {
        guarded.current = false
        setAsking({ then: () => leave(1), restoreGuard: true })
      }
    }
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener("popstate", onPop)
    window.addEventListener("beforeunload", onUnload)
    return () => {
      window.removeEventListener("popstate", onPop)
      window.removeEventListener("beforeunload", onUnload)
    }
  }, [open, dirty, leave])

  React.useEffect(() => {
    if (!open) {
      guarded.current = false
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the route closes the dialog
      setDirty(false)
    }
  }, [open, setDirty])

  const titleId = React.useId()
  const frame = React.useMemo<Frame>(
    () => ({ mode: "dialog", labels: t, titleId, depth, back, close, setDirty }),
    [t, titleId, depth, back, close, setDirty],
  )

  // Tell the list (and anyone else) when the dialog opens and closes.
  const lastOrigin = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (originNow && lastOrigin.current !== originNow) {
      lastOrigin.current = originNow
      dispatchRoutedDialogEvent({ type: "open", origin: originNow })
    } else if (!originNow && lastOrigin.current) {
      const closed = lastOrigin.current
      lastOrigin.current = null
      dispatchRoutedDialogEvent({ type: "close", origin: closed })
    }
  }, [originNow])

  return (
    <FrameContext.Provider value={frame}>
      {open && originNow ? <RoutedDialogFrame origin={originNow}>
          {children}
        </RoutedDialogFrame> : children}
      <Dialog
        open={!!asking}
        onOpenChange={(o) => {
          if (o || !asking) return
          if (asking.restoreGuard) {
            window.history.pushState(window.history.state, "", window.location.href)
            guarded.current = true
          }
          setAsking(null)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t.discardTitle}</DialogTitle>
            <DialogDescription>{t.discardDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (asking?.restoreGuard) {
                  window.history.pushState(window.history.state, "", window.location.href)
                  guarded.current = true
                }
                setAsking(null)
              }}
            >
              {t.discardCancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const then = asking?.then
                setAsking(null)
                setDirty(false)
                then?.()
              }}
            >
              {t.discardConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FrameContext.Provider>
  )
}

/** The panel itself: portal, dimmed list behind, scroll lock, Esc, click outside and swipe down. */
function RoutedDialogFrame({ origin, children }: { origin: string; children: React.ReactNode }) {
  const { close, titleId } = React.useContext(FrameContext)
  const pathname = usePathname()
  const panelRef = React.useRef<HTMLDivElement>(null)
  const bodyHost = typeof document === "undefined" ? null : document.body

  // The list stays mounted but out of reach: no scroll, no focus, hidden from screen readers.
  React.useEffect(() => {
    const panel = panelRef.current?.closest("[data-slot='routed-dialog-root']")
    const html = document.documentElement
    const previousOverflow = html.style.overflow
    html.style.overflow = "hidden"
    const inerted = Array.from(document.body.children).filter(
      (el) => el !== panel && !el.hasAttribute("inert") && !el.querySelector("[data-sonner-toaster]"),
    )
    for (const el of inerted) el.setAttribute("inert", "")
    return () => {
      html.style.overflow = previousOverflow
      for (const el of inerted) el.removeAttribute("inert")
    }
  }, [])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return
      const target = e.target instanceof Element ? e.target : null
      // Esc inside a menu, popover or select closes that first.
      if (target?.closest("[data-radix-popper-content-wrapper], [role='menu'], [role='listbox']")) return
      if (document.querySelector("[data-slot='dialog-content']")) return
      close()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [close])

  useSwipeDown(panelRef, close)

  if (!bodyHost) return null
  return createPortal(
    <div data-slot="routed-dialog-root" className="fixed inset-0 z-50 md:grid md:place-items-center md:p-6">
      <div
        aria-hidden
        data-slot="routed-dialog-backdrop"
        className="absolute inset-0 hidden bg-black/50 md:block"
        onClick={() => close()}
      />
      <React.ViewTransition name={routedTransitionName(origin)} share="routed-zoom" default="none">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-slot="routed-dialog"
          className="relative flex h-dvh w-full flex-col overflow-hidden bg-background will-change-transform md:h-auto md:max-h-[90dvh] md:max-w-3xl md:rounded-xl md:border md:shadow-xl md:has-[[data-chrome=none]]:h-[90dvh]"
        >
          <React.ViewTransition key={pathname} enter="routed-fade" exit="routed-fade" default="none">
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </React.ViewTransition>
        </div>
      </React.ViewTransition>
    </div>,
    bodyHost,
  )
}

/**
 * Goes `steps` back in the history inside a View Transition. React runs none for a history traversal,
 * so the kit does: closing shrinks the dialog back into the row or card it came from, and a step
 * back inside it crossfades the content. The browser's own back button closes without the zoom.
 */
async function goBackAnimated(steps: number, closing: boolean, origin: string | null) {
  const panel = document.querySelector<HTMLElement>("[data-slot='routed-dialog']")
  const from = window.location.href
  // Resolves once the router has committed the page it went back to (the history moves asynchronously).
  const settled = async () => {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 16))
      const moved = window.location.href !== from
      if (moved && (closing ? !document.querySelector("[data-slot='routed-dialog']") : i > 2)) return
    }
  }
  const animate =
    "startViewTransition" in document && panel && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (!animate) {
    window.history.go(-steps)
    await settled()
    return
  }
  const name = closing && origin ? routedTransitionName(origin) : "routed-panel"
  const set = (el: HTMLElement | null | undefined, cls: string) => {
    el?.style.setProperty("view-transition-name", name)
    el?.style.setProperty("view-transition-class", cls)
  }
  const unset = (el: HTMLElement | null | undefined) => {
    el?.style.removeProperty("view-transition-name")
    el?.style.removeProperty("view-transition-class")
  }
  set(panel, closing ? "routed-zoom" : "routed-fade")
  let originEl: HTMLElement | null = null
  const transition = document.startViewTransition(async () => {
    window.history.go(-steps)
    await settled()
    if (!closing || !origin) return
    const link = Array.from(document.querySelectorAll<HTMLElement>("a[href]")).find(
      (a) => a.getAttribute("href") === origin && a.offsetParent !== null,
    )
    originEl = link?.closest<HTMLElement>("li, tr") ?? link ?? null
    set(originEl, "routed-zoom")
  })
  await transition.updateCallbackDone.catch(() => {})
  transition.finished.finally(() => {
    unset(panel)
    unset(originEl)
  })
}

/** On the Celular: drag the header, or the body when it is scrolled to the top, down to close. */
function useSwipeDown(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  React.useEffect(() => {
    const panel = ref.current
    if (!panel) return
    let startY = 0
    let startT = 0
    let dy = 0
    let tracking = false
    const set = (y: number, animate: boolean) => {
      panel.style.transition = animate ? "transform 200ms ease-out" : ""
      panel.style.transform = y ? `translateY(${y}px)` : ""
    }
    const onStart = (e: TouchEvent) => {
      if (window.matchMedia(desktopQuery).matches || e.touches.length !== 1) return
      const target = e.target as HTMLElement
      const header = target.closest("[data-slot='routed-dialog-header'], [data-slot='mobile-flow-header']")
      const body = target.closest("[data-slot='routed-dialog-body'], [data-slot='mobile-flow-content']")
      if (target.closest("input, textarea, select, [contenteditable]")) return
      if (!header && !(body && body.scrollTop <= 0)) return
      tracking = true
      startY = e.touches[0].clientY
      startT = e.timeStamp
      dy = 0
    }
    const onMove = (e: TouchEvent) => {
      if (!tracking) return
      dy = e.touches[0].clientY - startY
      if (dy <= 0) {
        // Moving up is scrolling, not closing.
        tracking = dy === 0
        set(0, false)
        return
      }
      e.preventDefault()
      set(dy, false)
    }
    const onEnd = (e: TouchEvent) => {
      if (!tracking) return
      tracking = false
      const fast = dy / Math.max(1, e.timeStamp - startT) > 0.5
      if (dy > panel.offsetHeight * 0.3 || (fast && dy > 40)) {
        set(0, false)
        onClose()
      } else set(0, true)
    }
    panel.addEventListener("touchstart", onStart, { passive: true })
    panel.addEventListener("touchmove", onMove, { passive: false })
    panel.addEventListener("touchend", onEnd)
    panel.addEventListener("touchcancel", onEnd)
    return () => {
      panel.removeEventListener("touchstart", onStart)
      panel.removeEventListener("touchmove", onMove)
      panel.removeEventListener("touchend", onEnd)
      panel.removeEventListener("touchcancel", onEnd)
    }
  }, [ref, onClose])
}

/**
 * The content of an intercepted route (`@modal/(.)orders/[id]/page.tsx`). Compose with the
 * `RoutedDialog*` parts; the same content also goes in `RoutedPage` for the full page.
 */
export function RoutedDialog({
  chrome = "default",
  children,
}: {
  /** `"none"`: the content brings its own top bar (a `MobileFlow`), and the frame draws no header. */
  chrome?: "default" | "none"
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const { titleId } = React.useContext(FrameContext)
  // Focus: the first field of a form, else the title. The content may still be streaming (a skeleton
  // under Suspense), so wait for it, unless the user has already moved the focus inside.
  React.useEffect(() => {
    const root = ref.current
    if (!root) return
    const tryFocus = () => {
      if (root.contains(document.activeElement) && document.activeElement !== root) return true
      const field = root.querySelector<HTMLElement>(editable)
      const title = root.querySelector<HTMLElement>(`[id="${titleId}"], [data-slot='mobile-flow'] h1`)
      const target = field ?? title
      if (target && !field && !target.hasAttribute("tabindex")) target.tabIndex = -1
      target?.focus({ preventScroll: true })
      return !!target
    }
    if (tryFocus()) return
    const observer = new MutationObserver(() => {
      if (tryFocus()) observer.disconnect()
    })
    observer.observe(root, { childList: true, subtree: true })
    const stop = setTimeout(() => observer.disconnect(), 10_000)
    return () => {
      observer.disconnect()
      clearTimeout(stop)
    }
  }, [titleId])
  return (
    <div
      ref={ref}
      data-chrome={chrome}
      className={cn("flex min-h-0 flex-1 flex-col", chrome === "none" && "[&>[data-slot=mobile-flow]]:h-full")}
    >
      {children}
    </div>
  )
}

/** The full page at the same URL as the dialog (direct access, F5), with the same content. */
export function RoutedPage({
  backHref,
  labels,
  className,
  children,
}: {
  /** Where ← goes: the list. */
  backHref: string
  /** Partial overrides, merged over `defaultRoutedDialogLabels`. */
  labels?: Partial<RoutedDialogLabels>
  className?: string
  children: React.ReactNode
}) {
  const t = React.useMemo(() => mergeLabels(defaultRoutedDialogLabels, labels), [labels])
  const titleId = React.useId()
  const frame = React.useMemo<Frame>(
    () => ({ mode: "page", labels: t, titleId, depth: 1, back: noop, close: noop, backHref, setDirty: noop }),
    [t, titleId, backHref],
  )
  return (
    <FrameContext.Provider value={frame}>
      <section
        aria-labelledby={titleId}
        data-slot="routed-page"
        className={cn("mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-4 md:p-6", className)}
      >
        {children}
      </section>
    </FrameContext.Provider>
  )
}

/** Title block, with ← (after navigating inside, or to the list on the full page) and ×. */
export function RoutedDialogHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  const { mode, labels, depth, back, close, backHref } = React.useContext(FrameContext)
  const backButton =
    mode === "page" ? (
      backHref ? (
        <Button asChild variant="ghost" size="icon-sm" className="-ml-1.5">
          <Link href={backHref} aria-label={labels.back}>
            <ArrowLeft aria-hidden />
          </Link>
        </Button>
      ) : null
    ) : depth > 1 ? (
      <Button variant="ghost" size="icon-sm" aria-label={labels.back} onClick={() => back()} className="-ml-1.5">
        <ArrowLeft aria-hidden />
      </Button>
    ) : null
  return (
    <div
      data-slot="routed-dialog-header"
      className={cn(
        "flex shrink-0 items-start gap-2",
        mode === "dialog"
          ? "touch-none border-b p-4 pt-[calc(1rem+env(safe-area-inset-top))] md:touch-auto md:pt-4"
          : "pb-4",
        className,
      )}
      {...props}
    >
      {backButton}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</div>
      {mode === "dialog" ? (
        <Button variant="ghost" size="icon-sm" aria-label={labels.close} onClick={() => close()} className="-mr-1.5">
          <X aria-hidden />
        </Button>
      ) : null}
    </div>
  )
}

export function RoutedDialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  const { mode, titleId } = React.useContext(FrameContext)
  const Heading = mode === "page" ? "h1" : "h2"
  return (
    <Heading
      id={titleId}
      tabIndex={-1}
      data-slot="routed-dialog-title"
      className={cn("text-lg font-semibold outline-none", mode === "page" && "text-xl", className)}
      {...props}
    />
  )
}

export function RoutedDialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="routed-dialog-description" className={cn("text-muted-foreground", className)} {...props} />
}

export function RoutedDialogBody({ className, ...props }: React.ComponentProps<"div">) {
  const { mode } = React.useContext(FrameContext)
  return (
    <div
      data-slot="routed-dialog-body"
      className={cn(
        "flex flex-col gap-4",
        mode === "dialog" ? "min-h-0 flex-1 overflow-y-auto overscroll-contain py-4" : "py-2",
        className,
      )}
      {...props}
    />
  )
}

/** Actions row; fixed at the bottom of the dialog and clear of the home indicator on the Celular. */
export function RoutedDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  const { mode } = React.useContext(FrameContext)
  return (
    <div
      data-slot="routed-dialog-footer"
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 border-t bg-background p-4",
        mode === "dialog"
          ? "pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4"
          : "sticky bottom-0 -mx-4 mt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:static md:mx-0 md:border-t-0 md:px-0 md:pb-0",
        className,
      )}
      {...props}
    />
  )
}
