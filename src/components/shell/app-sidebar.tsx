"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"

import { type NavUserLabels, NavUser } from "@/components/shell/nav-user"
import { type WorkspaceSwitcherLabels, WorkspaceSwitcher } from "@/components/shell/workspace-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { navigation } from "@/lib/nav"
import { mergeLabels } from "@/lib/labels"

export type AppSidebarLabels = {
  navigation: string
  /** Accessible name of the pending-count badge, e.g. "12 pending". */
  pending: (count: string) => string
  /** Overrides forwarded to the workspace switcher. */
  workspaceSwitcher?: Partial<WorkspaceSwitcherLabels>
  /** Overrides forwarded to the user menu. */
  navUser?: Partial<NavUserLabels>
}

export const defaultAppSidebarLabels: AppSidebarLabels = {
  navigation: "Main navigation",
  pending: (count) => `${count} pending`,
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}

type NavItem = (typeof navigation)[number]["items"][number]

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
      <Link href={item.href} aria-current={active ? "page" : undefined}>
        <item.icon aria-hidden />
        <span>{item.title}</span>
      </Link>
    </SidebarMenuButton>
  )
}

function ActiveNavLink({ item }: { item: NavItem }) {
  return <NavLink item={item} active={isActive(usePathname(), item.href)} />
}

export function AppSidebar({
  labels,
  ...props
}: React.ComponentProps<typeof Sidebar> & { labels?: Partial<AppSidebarLabels> }) {
  const t = mergeLabels(defaultAppSidebarLabels, labels)

  return (
    <Sidebar aria-label={t.navigation} {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher labels={t.workspaceSwitcher} />
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    {/* The active item is known only at request time; the shell prerenders without it. */}
                    <Suspense fallback={<NavLink item={item} active={false} />}>
                      <ActiveNavLink item={item} />
                    </Suspense>
                    {item.badge ? (
                      <SidebarMenuBadge aria-label={t.pending(item.badge)}>{item.badge}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ name: "Alex Morgan", email: "alex@example.com" }} labels={t.navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
