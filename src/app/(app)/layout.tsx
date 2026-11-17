import { AppSidebar } from "@/components/shell/app-sidebar"
import { SiteHeader } from "@/components/shell/site-header"
import { SkipLink } from "@/components/shell/skip-link"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// The shell stays static (prerendered). Reading the sidebar cookie here would make every
// route dynamic under cacheComponents, so the sidebar always starts open.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <SkipLink />
      <AppSidebar variant="inset" collapsible="icon" />
      <SidebarInset>
        <SiteHeader />
        <div id="main" className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
