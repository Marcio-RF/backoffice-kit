import {
  LayoutDashboard,
  Package,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

export type NavItem = { title: string; href: string; icon: LucideIcon; badge?: string }
export type NavGroup = { label: string; items: NavItem[] }

export const navigation: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { title: "Overview", href: "/", icon: LayoutDashboard },
      { title: "Orders", href: "/orders", icon: Package, badge: "12" },
      { title: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    label: "Configuration",
    items: [{ title: "Settings", href: "/settings", icon: Settings }],
  },
]

/** Human labels for path segments used by the breadcrumbs. */
export const segmentLabels: Record<string, string> = {
  orders: "Orders",
  new: "New order",
  customers: "Customers",
  settings: "Settings",
}
