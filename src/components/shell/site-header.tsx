"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

import { type CommandMenuLabels, CommandMenu } from "@/components/shell/command-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { segmentLabels } from "@/lib/nav"
import { mergeLabels } from "@/lib/labels"

export type SiteHeaderLabels = {
  /** First breadcrumb, the root page. */
  overview: string
  /** Overrides forwarded to the command menu. */
  commandMenu?: Partial<CommandMenuLabels>
}

export const defaultSiteHeaderLabels: SiteHeaderLabels = { overview: "Overview" }

export function SiteHeader({ labels }: { labels?: Partial<SiteHeaderLabels> }) {
  const t = mergeLabels(defaultSiteHeaderLabels, labels)
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const crumbs = [
    { href: "/", label: t.overview },
    ...segments.map((s, i) => ({
      href: `/${segments.slice(0, i + 1).join("/")}`,
      label: segmentLabels[s] ?? s,
    })),
  ]

  return (
    <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur md:rounded-t-xl">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1
            return (
              <Fragment key={c.href}>
                {i > 0 ? <BreadcrumbSeparator className="hidden md:block" /> : null}
                <BreadcrumbItem className={last ? undefined : "hidden md:inline-flex"}>
                  {last ? (
                    <BreadcrumbPage>{c.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={c.href}>{c.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <CommandMenu labels={t.commandMenu} />
      </div>
    </header>
  )
}
