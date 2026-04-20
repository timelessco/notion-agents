import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ChartAgg, ChartConfigShape, ChartType, DateBucket } from "./chart-utils";
import { isGroupable, isNumeric } from "./chart-utils";
import type { DatabaseColumn } from "./types";

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "donut", label: "Donut" },
];

const AGGS: { value: ChartAgg; label: string }[] = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
];

const BUCKETS: { value: DateBucket; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1 text-[12px] text-muted-foreground">
    <span>{label}</span>
    {children}
  </label>
);

export const ChartSettingsForm = ({
  columns,
  config,
  onChange,
}: {
  columns: DatabaseColumn[];
  config: ChartConfigShape;
  onChange: (next: ChartConfigShape) => void;
}) => {
  const xCol = columns.find((c) => c.id === config.xColId);
  const isDateX = xCol?.type === "date" || xCol?.type === "date-range";

  const groupCols = columns.filter(isGroupable);
  const numCols = columns.filter(isNumeric);
  const seriesCols = columns.filter(
    (c) => c.type === "select" || c.type === "status" || c.type === "checkbox",
  );

  const update = (patch: Partial<ChartConfigShape>) => onChange({ ...config, ...patch });

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Chart type">
        <Select value={config.type} onValueChange={(v) => v && update({ type: v as ChartType })}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CHART_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Aggregate">
        <Select value={config.agg} onValueChange={(v) => v && update({ agg: v as ChartAgg })}>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGGS.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="X axis">
        <Select
          value={config.xColId || undefined}
          onValueChange={(v) => v && update({ xColId: v })}
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Select column" />
          </SelectTrigger>
          <SelectContent>
            {groupCols.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {config.agg !== "count" && (
        <Field label="Y axis">
          <Select
            value={config.yColId || undefined}
            onValueChange={(v) => v && update({ yColId: v })}
          >
            <SelectTrigger size="sm">
              <SelectValue placeholder="Select column" />
            </SelectTrigger>
            <SelectContent>
              {numCols.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {isDateX && (
        <Field label="Date bucket">
          <Select
            value={config.dateBucket ?? "month"}
            onValueChange={(v) => v && update({ dateBucket: v as DateBucket })}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUCKETS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      {config.type !== "pie" && config.type !== "donut" && seriesCols.length > 0 && (
        <Field label="Group by (optional)">
          <Select
            value={config.seriesColId ?? "__none__"}
            onValueChange={(v) => {
              if (!v) return;
              update({ seriesColId: v === "__none__" ? undefined : v });
            }}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {seriesCols.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
    </div>
  );
};

export const defaultChartConfig = (columns: DatabaseColumn[]): ChartConfigShape => {
  const x =
    columns.find((c) => c.type === "select" || c.type === "status") ??
    columns.find((c) => c.type === "date") ??
    columns.find(isGroupable) ??
    columns[0];
  const y = columns.find(isNumeric);
  return {
    type: "bar",
    xColId: x?.id ?? "",
    yColId: y?.id,
    agg: y ? "sum" : "count",
    dateBucket: "month",
  };
};
