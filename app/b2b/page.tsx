import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "./components/AppSidebar";
import { PodkarpacieMap } from "./components/PodkarpacieMap";
import { PowiatTable } from "./components/PowiatTable";
import { SectionCards } from "./components/SectionCards";
import { SiteHeader } from "./components/SiteHeader";
import { TrendChart } from "./components/TrendChart";

import rawData from "@/data/b2b/podkarpacie.json";
import type { B2BData } from "@/lib/b2b/types";

const data = rawData as B2BData;

export default function B2BDashboardPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--sidebar-width-icon": "3rem",
          "--header-height": "3rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader asOf={data.asOf} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards data={data} />

              <div id="heatmap" className="px-4 lg:px-6">
                <PodkarpacieMap data={data} />
              </div>

              <div id="trend" className="px-4 lg:px-6">
                <TrendChart data={data} />
              </div>

              <div id="table" className="px-4 lg:px-6">
                <PowiatTable data={data} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
