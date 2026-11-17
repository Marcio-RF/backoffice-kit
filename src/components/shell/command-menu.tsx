"use client"

import { Monitor, Moon, Plus, Search, Sun } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { navigation } from "@/lib/nav"
import { mergeLabels } from "@/lib/labels"

export type CommandMenuLabels = {
  trigger: string
  triggerText: string
  shortcut: string
  title: string
  description: string
  placeholder: string
  noResults: string
  actions: string
  newOrder: string
  goTo: string
  theme: string
  light: string
  dark: string
  system: string
}

export const defaultCommandMenuLabels: CommandMenuLabels = {
  trigger: "Search and run commands",
  triggerText: "Search…",
  shortcut: "Ctrl K",
  title: "Command menu",
  description: "Search pages and actions",
  placeholder: "Type a command or search…",
  noResults: "No results found.",
  actions: "Actions",
  newOrder: "New order",
  goTo: "Go to",
  theme: "Theme",
  light: "Light",
  dark: "Dark",
  system: "System",
}

export function CommandMenu({ labels }: { labels?: Partial<CommandMenuLabels> }) {
  const t = mergeLabels(defaultCommandMenuLabels, labels)
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { setTheme } = useTheme()

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  const run = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-8 justify-center px-0 text-muted-foreground sm:w-60 sm:justify-start sm:px-2.5"
        onClick={() => setOpen(true)}
        aria-label={t.trigger}
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search aria-hidden />
        <span className="hidden flex-1 text-left font-normal sm:inline">{t.triggerText}</span>
        <kbd
          aria-hidden
          className="pointer-events-none hidden h-5 items-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium sm:inline-flex"
        >
          {t.shortcut}
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title={t.title} description={t.description}>
        <CommandInput placeholder={t.placeholder} />
        <CommandList>
          <CommandEmpty>{t.noResults}</CommandEmpty>
          <CommandGroup heading={t.actions}>
            <CommandItem onSelect={() => run(() => router.push("/orders/new"))}>
              <Plus aria-hidden />
              {t.newOrder}
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={t.goTo}>
            {navigation
              .flatMap((g) => g.items)
              .map((item) => (
                <CommandItem key={item.href} onSelect={() => run(() => router.push(item.href))}>
                  <item.icon aria-hidden />
                  {item.title}
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={t.theme}>
            <CommandItem onSelect={() => run(() => setTheme("light"))}>
              <Sun aria-hidden />
              {t.light}
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("dark"))}>
              <Moon aria-hidden />
              {t.dark}
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme("system"))}>
              <Monitor aria-hidden />
              {t.system}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
