import type { DatabaseColumn, DatabaseRow, FilterLeaf, FilterNode, SortEntry } from "./types";
import { isLeaf } from "./types";

const resolveCellDisplay = (v: unknown, col: DatabaseColumn): string => {
  if (v == null || v === "") return "";
  if (col.type === "select" || col.type === "status") {
    const opt = (col.options ?? []).find((o) => o.id === v);
    return opt ? opt.label : "";
  }
  if (col.type === "multi-select") {
    return Array.isArray(v)
      ? v.map((id) => (col.options ?? []).find((o) => o.id === id)?.label ?? "").join(" ")
      : "";
  }
  return String(v);
};

const isEmptyVal = (v: unknown, col: DatabaseColumn): boolean => {
  if (v == null || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  if (col.type === "date-range") {
    return !(v as { start?: string }).start;
  }
  return false;
};

const evalLeaf = (leaf: FilterLeaf, row: DatabaseRow, columns: DatabaseColumn[]): boolean => {
  const col = columns.find((c) => c.id === leaf.colId);
  if (!col) return true;
  const raw =
    col.type === "created-time"
      ? row.createdAt
      : col.type === "last-edited-time"
        ? row.updatedAt
        : row.cells[col.id];
  const target = leaf.value;

  switch (leaf.op) {
    case "is-empty":
      return isEmptyVal(raw, col);
    case "is-not-empty":
      return !isEmptyVal(raw, col);
    case "is":
      return resolveCellDisplay(raw, col) === String(target ?? "");
    case "is-not":
      return resolveCellDisplay(raw, col) !== String(target ?? "");
    case "contains": {
      if (Array.isArray(raw)) return raw.includes(target as string);
      return resolveCellDisplay(raw, col)
        .toLowerCase()
        .includes(String(target ?? "").toLowerCase());
    }
    case "not-contains": {
      if (Array.isArray(raw)) return !raw.includes(target as string);
      return !resolveCellDisplay(raw, col)
        .toLowerCase()
        .includes(String(target ?? "").toLowerCase());
    }
    case "starts-with":
      return resolveCellDisplay(raw, col)
        .toLowerCase()
        .startsWith(String(target ?? "").toLowerCase());
    case "ends-with":
      return resolveCellDisplay(raw, col)
        .toLowerCase()
        .endsWith(String(target ?? "").toLowerCase());
    case "eq":
      return Number(raw) === Number(target);
    case "neq":
      return Number(raw) !== Number(target);
    case "gt":
      return Number(raw) > Number(target);
    case "gte":
      return Number(raw) >= Number(target);
    case "lt":
      return Number(raw) < Number(target);
    case "lte":
      return Number(raw) <= Number(target);
    case "before":
      return String(raw ?? "") < String(target ?? "");
    case "after":
      return String(raw ?? "") > String(target ?? "");
    case "on-or-before":
      return String(raw ?? "") <= String(target ?? "");
    case "on-or-after":
      return String(raw ?? "") >= String(target ?? "");
    case "is-checked":
      return Boolean(raw);
    case "is-unchecked":
      return !raw;
  }
};

export const evalFilter = (
  node: FilterNode,
  row: DatabaseRow,
  columns: DatabaseColumn[],
): boolean => {
  if (isLeaf(node)) return evalLeaf(node, row, columns);
  if (node.children.length === 0) return true;
  return node.combinator === "and"
    ? node.children.every((c) => evalFilter(c, row, columns))
    : node.children.some((c) => evalFilter(c, row, columns));
};

export const applyFilter = (
  rows: DatabaseRow[],
  filter: FilterNode,
  columns: DatabaseColumn[],
): DatabaseRow[] => rows.filter((r) => evalFilter(filter, r, columns));

export const applySort = (
  rows: DatabaseRow[],
  sorts: SortEntry[],
  columns: DatabaseColumn[],
): DatabaseRow[] => {
  if (sorts.length === 0) return rows;
  const cols = new Map(columns.map((c) => [c.id, c]));
  const copy = [...rows];
  copy.sort((a, b) => {
    for (const { colId, dir } of sorts) {
      const col = cols.get(colId);
      if (!col) continue;
      const av =
        col.type === "created-time"
          ? (a.createdAt ?? 0)
          : col.type === "last-edited-time"
            ? (a.updatedAt ?? 0)
            : a.cells[colId];
      const bv =
        col.type === "created-time"
          ? (b.createdAt ?? 0)
          : col.type === "last-edited-time"
            ? (b.updatedAt ?? 0)
            : b.cells[colId];
      const factor = dir === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") {
        if (av !== bv) return (av - bv) * factor;
      } else {
        const as = String(av ?? "");
        const bs = String(bv ?? "");
        if (as !== bs) return as.localeCompare(bs) * factor;
      }
    }
    return 0;
  });
  return copy;
};

export type GroupKey = { id: string; label: string };
export type GroupedRows = { key: GroupKey; rows: DatabaseRow[] }[];

export const applyGroup = (
  rows: DatabaseRow[],
  groupBy: string | undefined,
  columns: DatabaseColumn[],
): GroupedRows => {
  if (!groupBy) return [{ key: { id: "__all", label: "" }, rows }];
  const col = columns.find((c) => c.id === groupBy);
  if (!col) return [{ key: { id: "__all", label: "" }, rows }];
  const buckets = new Map<string, DatabaseRow[]>();
  const labels = new Map<string, string>();

  for (const row of rows) {
    const v = row.cells[groupBy];
    let key = "";
    let label = "No value";
    if (col.type === "select" || col.type === "status") {
      if (typeof v === "string" && v) {
        const opt = (col.options ?? []).find((o) => o.id === v);
        if (opt) {
          key = opt.id;
          label = opt.label;
        }
      }
    } else if (col.type === "checkbox") {
      key = v ? "yes" : "no";
      label = v ? "Checked" : "Unchecked";
    } else if (col.type === "rating") {
      key = String(v ?? 0);
      label = String(v ?? 0);
    } else if (col.type === "multi-select") {
      // groupBy multi-select = not ideal but supported: first option
      const first = Array.isArray(v) && v.length > 0 ? String(v[0]) : "";
      const opt = (col.options ?? []).find((o) => o.id === first);
      key = opt?.id ?? "";
      label = opt?.label ?? "No value";
    } else {
      key = String(v ?? "");
      label = key || "No value";
    }
    if (!buckets.has(key)) buckets.set(key, []);
    labels.set(key, label);
    buckets.get(key)!.push(row);
  }
  return Array.from(buckets.entries()).map(([id, rs]) => ({
    key: { id, label: labels.get(id) ?? "No value" },
    rows: rs,
  }));
};

export const conditionalColorFor = (
  row: DatabaseRow,
  columns: DatabaseColumn[],
  rules: { filter: FilterNode; colorIdx: number }[] | undefined,
): number | null => {
  if (!rules || rules.length === 0) return null;
  for (const r of rules) {
    if (evalFilter(r.filter, row, columns)) return r.colorIdx;
  }
  return null;
};
