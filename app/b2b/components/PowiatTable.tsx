"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { gapScore, scenarioLabelPL } from "@/lib/b2b/derived";
import type { B2BData, Powiat } from "@/lib/b2b/types";

type SortKey = "gap" | "growth" | "queries";

const SORTERS: Record<SortKey, (a: Powiat, b: Powiat) => number> = {
  gap: (a, b) => gapScore(b) - gapScore(a),
  growth: (a, b) => b.growthMoM - a.growthMoM,
  queries: (a, b) => b.queries30d - a.queries30d,
};

const SORT_LABELS: Record<SortKey, string> = {
  gap: "Demand vs supply",
  growth: "Wzrost m/m",
  queries: "Wolumen zapytań",
};

export function PowiatTable({ data }: { data: B2BData }) {
  const [sort, setSort] = useState<SortKey>("gap");
  const sorted = useMemo(
    () => [...data.powiats].sort(SORTERS[sort]).slice(0, 10),
    [data.powiats, sort]
  );

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Top 10 powiatów</CardTitle>
          <CardDescription>
            Posortowane wg: <strong>{SORT_LABELS[sort]}</strong>. Pierwsze
            wiersze to najgorętsze cele ekspansji.
          </CardDescription>
        </div>
        <Tabs value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <TabsList>
            <TabsTrigger value="gap">Gap</TabsTrigger>
            <TabsTrigger value="growth">Wzrost</TabsTrigger>
            <TabsTrigger value="queries">Wolumen</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <div className="px-2 pb-2 sm:px-4 sm:pb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Powiat</TableHead>
              <TableHead className="text-right">Zapytania 30d</TableHead>
              <TableHead className="text-right">Wzrost m/m</TableHead>
              <TableHead className="text-right">Q / klinika</TableHead>
              <TableHead>Top scenariusz</TableHead>
              <TableHead className="text-right">Luxmed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p, i) => {
              const ratio = p.queries30d / Math.max(p.existingClinics, 1);
              return (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {p.name}
                    <span className="ml-1.5 text-[10px] text-muted-foreground">
                      ({p.type === "grodzki" ? "miasto" : "powiat"})
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.queries30d.toLocaleString("pl-PL")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        p.growthMoM > 0.4
                          ? "font-medium text-success"
                          : p.growthMoM > 0.25
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }
                    >
                      +{(p.growthMoM * 100).toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span
                      className={
                        ratio > 250 ? "font-semibold text-warning" : ""
                      }
                    >
                      {ratio.toFixed(0)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {scenarioLabelPL(p.topScenario)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.luxmedClinics > 0 ? (
                      <Badge variant="default" className="text-[10px]">
                        {p.luxmedClinics}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
