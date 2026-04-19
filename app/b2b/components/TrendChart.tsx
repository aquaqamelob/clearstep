"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

import type { B2BData } from "@/lib/b2b/types";

const CHART_CONFIG = {
  mentalHealth: {
    label: "Mental health",
    color: "var(--chart-2)",
  },
  pregnancy: {
    label: "Pregnancy scare",
    color: "var(--chart-1)",
  },
  triage: {
    label: "Triage fizyczny",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function TrendChart({ data }: { data: B2BData }) {
  const [range, setRange] = useState<"30d" | "14d" | "7d">("30d");

  const points = useMemo(() => {
    const slice = range === "7d" ? -7 : range === "14d" ? -14 : -30;
    return data.trend30d.slice(slice).map((p) => ({
      ...p,
      label: new Date(p.date).toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
      }),
    }));
  }, [data.trend30d, range]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Trend zapytań — dekompozycja</CardTitle>
          <CardDescription>
            Widać sezonowość weekendową (spadki sobota / niedziela) i ramp-up
            mental health po świętach.
          </CardDescription>
        </div>
        <ToggleGroup
          type="single"
          value={range}
          onValueChange={(v) => v && setRange(v as typeof range)}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="7d">7d</ToggleGroupItem>
          <ToggleGroupItem value="14d">14d</ToggleGroupItem>
          <ToggleGroupItem value="30d">30d</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={CHART_CONFIG}
          className="aspect-auto h-[260px] w-full"
        >
          <AreaChart data={points}>
            <defs>
              <linearGradient id="fillMH" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mentalHealth)"
                  stopOpacity={0.85}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mentalHealth)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="fillPreg" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-pregnancy)"
                  stopOpacity={0.85}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-pregnancy)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="fillTriage" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-triage)"
                  stopOpacity={0.85}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-triage)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeOpacity={0.4} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              fontSize={11}
              width={28}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey="mentalHealth"
              type="natural"
              stroke="var(--color-mentalHealth)"
              fill="url(#fillMH)"
              stackId="a"
            />
            <Area
              dataKey="pregnancy"
              type="natural"
              stroke="var(--color-pregnancy)"
              fill="url(#fillPreg)"
              stackId="a"
            />
            <Area
              dataKey="triage"
              type="natural"
              stroke="var(--color-triage)"
              fill="url(#fillTriage)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
