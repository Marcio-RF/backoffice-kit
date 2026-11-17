"use client"

import type { Column } from "@tanstack/react-table"
import { Check, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { mergeLabels } from "@/lib/labels"
import { cn } from "@/lib/utils"

type Option = { label: string; value: string }

export type FacetedFilterLabels = {
  /** Shown on the chip when more than two options are selected. */
  selected: (count: number) => string
  noResults: string
  clear: string
}

export const defaultFacetedFilterLabels: FacetedFilterLabels = {
  selected: (count) => `${count} selected`,
  noResults: "No results found.",
  clear: "Clear filter",
}

/** Stripe-style filter chip: multi-select with live counts per option. */
export function FacetedFilter<TData, TValue>({
  column,
  title,
  options,
  labels,
}: {
  column?: Column<TData, TValue>
  title: string
  options: Option[]
  /** Partial overrides, merged over `defaultFacetedFilterLabels`. */
  labels?: Partial<FacetedFilterLabels>
}) {
  const t = mergeLabels(defaultFacetedFilterLabels, labels)
  const facets = column?.getFacetedUniqueValues()
  const selected = new Set((column?.getFilterValue() as string[] | undefined) ?? [])

  const toggle = (value: string) => {
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    column?.setFilterValue(next.size ? Array.from(next) : undefined)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="border-dashed">
          <PlusCircle aria-hidden />
          {title}
          {selected.size > 0 ? (
            <>
              <Separator orientation="vertical" className="mx-0.5 data-[orientation=vertical]:h-4" />
              <span className="rounded bg-secondary px-1.5 text-xs font-medium">
                {selected.size > 2
                  ? t.selected(selected.size)
                  : options
                      .filter((o) => selected.has(o.value))
                      .map((o) => o.label)
                      .join(", ")}
              </span>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>{t.noResults}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const isSelected = selected.has(o.value)
                return (
                  <CommandItem key={o.value} onSelect={() => toggle(o.value)} aria-selected={isSelected}>
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-4 items-center justify-center rounded-[4px] border",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input",
                      )}
                    >
                      {isSelected ? <Check className="size-3" /> : null}
                    </span>
                    <span className="flex-1">{o.label}</span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {facets?.get(o.value) ?? 0}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.size > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => column?.setFilterValue(undefined)} className="justify-center">
                    {t.clear}
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
