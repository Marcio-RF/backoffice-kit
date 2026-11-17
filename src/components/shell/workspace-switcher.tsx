"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

export type WorkspaceSwitcherLabels = {
  environment: string
  current: string
}

export const defaultWorkspaceSwitcherLabels: WorkspaceSwitcherLabels = {
  environment: "Environment",
  current: "Current",
}

const environments = ["Production", "Staging"]

export function WorkspaceSwitcher({
  name = "Acme Rentals",
  labels,
}: {
  name?: string
  labels?: Partial<WorkspaceSwitcherLabels>
}) {
  const t = { ...defaultWorkspaceSwitcherLabels, ...labels }
  const { isMobile } = useSidebar()
  const [current, setCurrent] = React.useState(0)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
              <div
                aria-hidden
                className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground"
              >
                {name[0]}
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{environments[current]}</span>
              </div>
              <ChevronsUpDown className="ml-auto" aria-hidden />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56" align="start" side={isMobile ? "bottom" : "right"} sideOffset={4}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">{t.environment}</DropdownMenuLabel>
            {environments.map((env, i) => (
              <DropdownMenuItem key={env} onSelect={() => setCurrent(i)}>
                <span className="flex-1">{env}</span>
                {i === current ? <Check aria-label={t.current} /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
