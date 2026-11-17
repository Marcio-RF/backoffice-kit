"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { mergeLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"

export type MobileFlowLabels = {
  /** Accessible name of the back button in the top bar. */
  back: string
}

export const defaultMobileFlowLabels: MobileFlowLabels = {
  back: "Back",
}

const LabelsContext = React.createContext<MobileFlowLabels>(defaultMobileFlowLabels)

type MobileFlowProps = {
  /** Partial overrides, merged over `defaultMobileFlowLabels`. */
  labels?: Partial<MobileFlowLabels>
  className?: string
  /** Compose with `MobileFlowHeader`, `MobileFlowContent` and `MobileFlowActions`. */
  children: React.ReactNode
}

/** The Fluxo móvel: a full-height (`dvh`) layout without sidebar. Layout only; no step state. */
function MobileFlow({ labels, className, children }: MobileFlowProps) {
  const t = React.useMemo(() => mergeLabels(defaultMobileFlowLabels, labels), [labels])
  return (
    <LabelsContext.Provider value={t}>
      <div data-slot="mobile-flow" className={cn("flex h-dvh flex-col bg-background", className)}>
        {children}
      </div>
    </LabelsContext.Provider>
  )
}

type MobileFlowHeaderProps = {
  /** Title of the current step. */
  title: string
  /** Back as a link. Wins over `onBack` when both are given. */
  backHref?: string
  /** Back as a button. */
  onBack?: () => void
  /** Slot at the right end of the bar. */
  right?: React.ReactNode
  className?: string
}

/** Thin top bar: back button, step title and a right slot. Keeps clear of the notch. */
function MobileFlowHeader({ title, backHref, onBack, right, className }: MobileFlowHeaderProps) {
  const t = React.useContext(LabelsContext)
  const hasBack = backHref !== undefined || onBack !== undefined
  return (
    <header
      data-slot="mobile-flow-header"
      className={cn(
        "flex shrink-0 items-center gap-2 border-b bg-background px-2 pt-[env(safe-area-inset-top)] pb-2",
        className,
      )}
    >
      {hasBack ? (
        backHref !== undefined ? (
          <Button asChild variant="ghost" size="icon">
            <Link href={backHref} aria-label={t.back}>
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="icon" aria-label={t.back} onClick={onBack}>
            <ArrowLeft aria-hidden />
          </Button>
        )
      ) : null}
      <h1 className="min-w-0 flex-1 truncate px-2 text-base font-semibold">{title}</h1>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </header>
  )
}

/** Scrolls between the two bars. */
function MobileFlowContent({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="mobile-flow-content"
      className={cn("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4", className)}
      {...props}
    />
  )
}

/** Primary action bar, fixed at the bottom; the buttons go in as children. Keeps clear of the home indicator. */
function MobileFlowActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="mobile-flow-actions"
      className={cn(
        "flex shrink-0 items-center gap-2 border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] *:flex-1",
        className,
      )}
      {...props}
    />
  )
}

export { MobileFlow, MobileFlowActions, MobileFlowContent, MobileFlowHeader }
