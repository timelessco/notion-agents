import type { ChartConfig } from "@/components/ui/chart";

import type { DatabaseColumn, DatabaseRow } from "./types";

const CHART_COLOR_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export type ChartType = "bar" | "line" | "area" | "pie" | "donut";
export type ChartAgg = "count" | "sum" | "avg" | "min" | "max";
export type DateBucket = "day" | "week" | "month" | "year";

export type ChartConfigShape = {
  type: ChartType;
  xColId: string;
  yColId?: string;
  agg: ChartAgg;
  dateBucket?: DateBucket;
  seriesColId?: string;
};

export type AggregatedPoint = {
  x: string;
  xLabel: string;
} & Record<string, number | string>;

const GROUPABLE = new Set<DatabaseColumn["type"]>([
  "select",
  "status",
  "multi-select",
  "checkbox",
  "date",
  "title",
  "text",
  "number",
]);

const NUMERIC = new Set<DatabaseColumn["type"]>(["number", "currency", "rating", "linear-scale"]);

export const isGroupable = (col: DatabaseColumn) => GROUPABLE.has(col.type);
export const isNumeric = (col: DatabaseColumn) => NUMERIC.has(col.type);

const pad = (n: number) => String(n).padStart(2, "0");

export const bucketDate = (
  raw: unknown,
  bucket: DateBucket,
): { key: string; label: string } | null => {
  if (!raw) return null;
  const d = new Date(raw as string);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  switch (bucket) {
    case "year":
      return { key: `${y}`, label: `${y}` };
    case "month":
      return {
        key: `${y}-${pad(m + 1)}`,
        label: d.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
      };
    case "week": {
      const copy = new Date(d);
      copy.setHours(0, 0, 0, 0);
      copy.setDate(copy.getDate() - copy.getDay());
      return {
        key: `${copy.getFullYear()}-${pad(copy.getMonth() + 1)}-${pad(copy.getDate())}`,
        label: copy.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      };
    }
    default:
      return {
        key: `${y}-${pad(m + 1)}-${pad(day)}`,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      };
  }
};

const resolveGroupKey = (
  value: unknown,
  col: DatabaseColumn,
  bucket: DateBucket | undefined,
): { key: string; label: string } => {
  if (col.type === "date" || col.type === "date-range") {
    const v =
      col.type === "date-range" && value && typeof value === "object"
        ? (value as { start?: string }).start
        : (value as string | undefined);
    const bucketed = bucketDate(v, bucket ?? "month");
    if (bucketed) return bucketed;
    return { key: "__empty__", label: "No date" };
  }

  if (col.type === "select" || col.type === "status") {
    if (typeof value !== "string" || !value) return { key: "__empty__", label: "Empty" };
    const opt = col.options?.find((o) => o.id === value);
    return { key: value, label: opt?.label ?? "Unknown" };
  }

  if (col.type === "checkbox") {
    const b = value === true;
    return { key: b ? "true" : "false", label: b ? "Yes" : "No" };
  }

  if (col.type === "title" || col.type === "text") {
    const s = typeof value === "string" ? value : "";
    const key = s || "__empty__";
    return { key, label: s || "Empty" };
  }

  if (col.type === "multi-select") {
    // Multi-select is handled at caller (each row contributes multiple buckets)
    return { key: "__empty__", label: "Empty" };
  }

  const s = value == null ? "__empty__" : String(value);
  return { key: s, label: s === "__empty__" ? "Empty" : s };
};

const resolveTitleFromRow = (row: DatabaseRow, col: DatabaseColumn): unknown => {
  if (col.type === "title") return row.title ?? row.cells[col.id] ?? "";
  return row.cells[col.id];
};

const toNumber = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === "boolean") return v ? 1 : 0;
  return null;
};

const applyAgg = (values: number[], agg: ChartAgg): number => {
  if (agg === "count") return values.length;
  if (values.length === 0) return 0;
  switch (agg) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return 0;
  }
};

type Bucket = {
  label: string;
  // seriesKey -> list of numeric y values
  series: Map<string, number[]>;
};

export const aggregateRows = (
  rows: DatabaseRow[],
  columns: DatabaseColumn[],
  config: ChartConfigShape,
): { data: AggregatedPoint[]; seriesKeys: string[]; seriesLabels: Record<string, string> } => {
  const xCol = columns.find((c) => c.id === config.xColId);
  if (!xCol) return { data: [], seriesKeys: [], seriesLabels: {} };

  const yCol = config.yColId ? columns.find((c) => c.id === config.yColId) : undefined;
  const seriesCol = config.seriesColId
    ? columns.find((c) => c.id === config.seriesColId)
    : undefined;

  const buckets = new Map<string, Bucket>();
  const seriesLabels: Record<string, string> = {};

  const pushValue = (
    xKey: string,
    xLabel: string,
    seriesKey: string,
    seriesLabel: string,
    yVal: number | null,
  ) => {
    let bucket = buckets.get(xKey);
    if (!bucket) {
      bucket = { label: xLabel, series: new Map() };
      buckets.set(xKey, bucket);
    }
    let arr = bucket.series.get(seriesKey);
    if (!arr) {
      arr = [];
      bucket.series.set(seriesKey, arr);
    }
    if (config.agg === "count") {
      arr.push(1);
    } else if (yVal != null) {
      arr.push(yVal);
    }
    if (!seriesLabels[seriesKey]) seriesLabels[seriesKey] = seriesLabel;
  };

  for (const row of rows) {
    const xRaw = resolveTitleFromRow(row, xCol);
    const yRaw = yCol ? row.cells[yCol.id] : null;
    const yNum = yCol ? toNumber(yRaw) : null;

    // Expand multi-select x into multiple buckets
    const xKeys: Array<{ key: string; label: string }> = [];
    if (xCol.type === "multi-select") {
      const arr = Array.isArray(xRaw) ? (xRaw as string[]) : [];
      if (arr.length === 0) xKeys.push({ key: "__empty__", label: "Empty" });
      for (const id of arr) {
        const opt = xCol.options?.find((o) => o.id === id);
        xKeys.push({ key: id, label: opt?.label ?? "Unknown" });
      }
    } else {
      xKeys.push(resolveGroupKey(xRaw, xCol, config.dateBucket));
    }

    // Series key
    let seriesKey = "value";
    let seriesLabel = yCol?.name ?? "Count";
    if (seriesCol) {
      const sRaw = row.cells[seriesCol.id];
      const resolved = resolveGroupKey(sRaw, seriesCol, config.dateBucket);
      seriesKey = resolved.key;
      seriesLabel = resolved.label;
    }

    for (const x of xKeys) {
      pushValue(x.key, x.label, seriesKey, seriesLabel, yNum);
    }
  }

  const seriesKeySet = new Set<string>();
  for (const b of buckets.values()) {
    for (const k of b.series.keys()) seriesKeySet.add(k);
  }
  const seriesKeys = Array.from(seriesKeySet);

  const data: AggregatedPoint[] = [];
  for (const [xKey, bucket] of buckets) {
    const point: AggregatedPoint = { x: xKey, xLabel: bucket.label };
    for (const sk of seriesKeys) {
      const vals = bucket.series.get(sk) ?? [];
      point[sk] = applyAgg(vals, config.agg);
    }
    data.push(point);
  }

  // Sort: dates by key, else by label
  if (xCol.type === "date" || xCol.type === "date-range") {
    data.sort((a, b) => a.x.localeCompare(b.x));
  } else {
    data.sort((a, b) => a.xLabel.localeCompare(b.xLabel));
  }

  return { data, seriesKeys, seriesLabels };
};

export const buildChartConfigForSeries = (
  seriesKeys: string[],
  seriesLabels: Record<string, string>,
): ChartConfig => {
  const config: ChartConfig = {};
  seriesKeys.forEach((key, idx) => {
    config[key] = {
      label: seriesLabels[key] ?? key,
      color: CHART_COLOR_VARS[idx % CHART_COLOR_VARS.length],
    };
  });
  return config;
};
