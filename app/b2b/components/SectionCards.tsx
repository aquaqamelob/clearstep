import { Activity, Building2, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { B2BData } from "@/lib/b2b/types";

export function SectionCards({ data }: { data: B2BData }) {
  const { totals } = data;
  const growth =
    (totals.queries30d - totals.queriesPrev30d) / totals.queriesPrev30d;
  const queriesPerClinic =
    totals.queries30d / Math.max(totals.existingPrivateClinics, 1);
  const luxmedShare = totals.luxmedFootprint / totals.existingPrivateClinics;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Activity className="size-3.5" /> Zapytania (30d)
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[180px]/card:text-3xl">
            {totals.queries30d.toLocaleString("pl-PL")}
          </CardTitle>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="default" className="gap-1">
              <TrendingUp className="size-3" />
              {(growth * 100).toFixed(0)}% m/m
            </Badge>
            <span className="text-xs text-muted-foreground">
              vs. {totals.queriesPrev30d.toLocaleString("pl-PL")}
            </span>
          </div>
        </CardHeader>
      </Card>

      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Users className="size-3.5" /> Unikalni użytkownicy
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[180px]/card:text-3xl">
            {totals.uniqueUsers30d.toLocaleString("pl-PL")}
          </CardTitle>
          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            ≈{" "}
            {((totals.uniqueUsers30d / totals.queries30d) * 100).toFixed(0)}%
            jednorazowych vs powracających
          </div>
        </CardHeader>
      </Card>

      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Building2 className="size-3.5" /> Zapytania / klinika
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[180px]/card:text-3xl">
            {queriesPerClinic.toFixed(0)}
          </CardTitle>
          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            {totals.existingPrivateClinics} prywatnych w regionie
          </div>
        </CardHeader>
      </Card>

      <Card className="@container/card" data-slot="card">
        <CardHeader>
          <CardDescription className="flex items-center gap-1.5">
            <Building2 className="size-3.5" /> Udział Luxmed
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[180px]/card:text-3xl">
            {(luxmedShare * 100).toFixed(0)}%
          </CardTitle>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="secondary" className="gap-1">
              {totals.luxmedFootprint} z {totals.existingPrivateClinics}
            </Badge>
            <span className="text-xs text-muted-foreground">
              przestrzeń do wzrostu
            </span>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
