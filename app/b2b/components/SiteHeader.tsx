"use client";

import { Calendar, Download, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader({ asOf }: { asOf: string }) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-col leading-tight">
          <h1 className="text-base font-medium">Podkarpackie · obraz rynku</h1>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Calendar className="size-2.5" /> dane na {asOf} · 30-dniowe okno
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Sparkles className="size-3.5" />
            <span>AI insights</span>
          </Button>
          <Button variant="outline" size="sm">
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Eksport PDF</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
