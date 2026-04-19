import { useMemo } from "react";

import type { ColumnConfig, DatabaseColumn, DatabaseRow, RollupAgg } from "../types";

const aggregate = (values: unknown[], agg: RollupAgg): unknown => {
  const nums = values
    .map((v) => (typeof v === "number" ? v : v === "" || v == null ? null : Number(v)))
    .filter((v): v is number => v !== null && Number.isFinite(v));
  switch (agg) {
    case "count":
      return values.length;
    case "count-unique":
      return new Set(values.map((v) => (typeof v === "object" ? JSON.stringify(v) : v))).size;
    case "sum":
      return nums.reduce((s, x) => s + x, 0);
    case "avg":
      return nums.length ? nums.reduce((s, x) => s + x, 0) / nums.length : 0;
    case "min":
      return nums.length ? Math.min(...nums) : "";
    case "max":
      return nums.length ? Math.max(...nums) : "";
    case "earliest": {
      const dates = values.filter((v) => typeof v === "string" && v);
      return dates.length ? dates.sort()[0] : "";
    }
    case "latest": {
      const dates = values.filter((v) => typeof v === "string" && v);
      return dates.length ? dates.sort().slice(-1)[0] : "";
    }
    case "concat":
      return values.filter((v) => v !== "" && v != null).join(", ");
  }
};

export const RollupCell = ({
  row,
  columns,
  allRows,
  config,
}: {
  row: DatabaseRow;
  columns: DatabaseColumn[];
  allRows: DatabaseRow[];
  config?: ColumnConfig;
}) => {
  const display = useMemo(() => {
    if (config?.kind !== "rollup") return "—";
    const { relationColId, targetColId, agg } = config;
    const relCol = columns.find((c) => c.id === relationColId);
    const tgtCol = columns.find((c) => c.id === targetColId);
    if (!relCol || !tgtCol) return "—";
    const linkedIds = Array.isArray(row.cells[relationColId])
      ? (row.cells[relationColId] as unknown[]).filter(
          (x): x is string => typeof x === "string",
        )
      : [];
    const values = linkedIds
      .map((id) => allRows.find((r) => r.id === id)?.cells[targetColId])
      .filter((v) => v !== undefined);
    const result = aggregate(values, agg);
    return result === "" || result == null ? "—" : String(result);
  }, [row, columns, allRows, config]);

  return (
    <span className="block w-full truncate text-left text-[13px] text-muted-foreground">
      {display}
    </span>
  );
};
