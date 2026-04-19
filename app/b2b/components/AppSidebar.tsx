"use client";

import {
  BarChart3,
  Building2,
  FileText,
  Map,
  PieChart,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_MAIN = [
  { title: "Heatmapa Podkarpacia", url: "#heatmap", icon: Map, active: true },
  { title: "Trendy zapytań", url: "#trend", icon: BarChart3 },
  { title: "Mix scenariuszy", url: "#mix", icon: PieChart },
  { title: "Powiaty / ranking", url: "#table", icon: Building2 },
];

const NAV_DOCUMENTS = [
  { title: "Raporty PDF", url: "#", icon: FileText },
  { title: "Segmenty pacjentów", url: "#", icon: Users },
];

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/b2b">
                <div className="flex aspect-square size-7 items-center justify-center rounded-lg bg-foreground text-background">
                  <Map className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ClearStep B2B</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Sales intelligence
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Analityka regionalna</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_MAIN.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.active}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Dokumenty</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_DOCUMENTS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings />
              <span>Ustawienia organizacji</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex aspect-square size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
                LM
              </div>
              <div className="grid flex-1 text-left text-xs leading-tight">
                <span className="truncate font-medium">Luxmed Polska</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  pilot · 30-dniowa licencja
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
