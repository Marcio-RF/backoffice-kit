"use client"

import { X } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { mergeLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"

export type DetailSheetLabels = {
  /** Accessible name of the close button in the header. */
  close: string
}

export const defaultDetailSheetLabels: DetailSheetLabels = {
  close: "Close",
}

const LabelsContext = React.createContext<DetailSheetLabels>(defaultDetailSheetLabels)

type DetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Partial overrides, merged over `defaultDetailSheetLabels`. */
  labels?: Partial<DetailSheetLabels>
  className?: string
  /** Compose with `DetailSheetHeader`, `DetailSheetBody` and `DetailSheetFooter`. */
  children: React.ReactNode
}

/** The Detail of a record: a side panel (max width `md`) from md up, full screen on the Celular. */
function DetailSheet({ open, onOpenChange, labels, className, children }: DetailSheetProps) {
  const t = React.useMemo(() => mergeLabels(defaultDetailSheetLabels, labels), [labels])
  return (
    <LabelsContext.Provider value={t}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          showCloseButton={false}
          aria-describedby={undefined}
          className={cn(
            "gap-0 data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:sm:max-w-none data-[side=right]:md:max-w-md",
            className,
          )}
        >
          {children}
        </SheetContent>
      </Sheet>
    </LabelsContext.Provider>
  )
}

/** Title and description go in as children (`DetailSheetTitle`, `DetailSheetDescription`); the close button is added. */
function DetailSheetHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  const t = React.useContext(LabelsContext)
  return (
    <div
      data-slot="detail-sheet-header"
      className={cn(
        "flex items-start gap-2 border-b p-4 pt-[calc(1rem+env(safe-area-inset-top))] md:pt-4",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</div>
      <SheetClose asChild>
        <Button variant="ghost" size="icon-sm" aria-label={t.close}>
          <X aria-hidden />
        </Button>
      </SheetClose>
    </div>
  )
}

function DetailSheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="detail-sheet-body"
      className={cn("flex flex-1 flex-col gap-4 overflow-y-auto py-4", className)}
      {...props}
    />
  )
}

/** Actions row; keeps clear of the home indicator on the Celular. */
function DetailSheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="detail-sheet-footer"
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
        className,
      )}
      {...props}
    />
  )
}

export {
  DetailSheet,
  DetailSheetBody,
  DetailSheetFooter,
  DetailSheetHeader,
  SheetDescription as DetailSheetDescription,
  SheetTitle as DetailSheetTitle,
}
