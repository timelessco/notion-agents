import type { Value } from "platejs";

export type ColumnType =
  | "text"
  | "email"
  | "phone"
  | "url"
  | "number"
  | "currency"
  | "rating"
  | "linear-scale"
  | "select"
  | "multi-select"
  | "status"
  | "checkbox"
  | "date"
  | "date-range"
  | "time"
  | "file"
  | "relation"
  | "formula"
  | "rollup"
  | "created-time"
  | "created-by"
  | "last-edited-time"
  | "last-edited-by";

export type SelectOption = { id: string; label: string; colorIdx: number };

export type StatusGroup = {
  id: string;
  name: "todo" | "in-progress" | "complete";
  label: string;
  options: SelectOption[];
};

export type FileValue = { id: string; name: string; url: string };

export type DateRangeValue = { start: string; end?: string };

export type RollupAgg =
  | "count"
  | "count-unique"
  | "sum"
  | "avg"
  | "min"
  | "max"
  | "earliest"
  | "latest"
  | "concat";

export type ColumnConfig =
  | { kind: "none" }
  | { kind: "currency"; code: "USD" | "EUR" | "INR" | "GBP" | "JPY" }
  | { kind: "rating"; max: number; style: "star" | "heart" }
  | { kind: "linear-scale"; min: number; max: number; step: number }
  | { kind: "status"; groups: StatusGroup[] }
  | { kind: "relation"; databaseId?: string }
  | { kind: "formula"; expression: string }
  | { kind: "rollup"; relationColId: string; targetColId: string; agg: RollupAgg };

export type DatabaseColumn = {
  id: string;
  name: string;
  type: ColumnType;
  options?: SelectOption[];
  width?: number;
  config?: ColumnConfig;
};

export type DatabaseRow = {
  id: string;
  icon?: string;
  cover?: string;
  title?: string;
  content?: Value;
  cells: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
};

export type FilterOperator =
  | "is"
  | "is-not"
  | "contains"
  | "not-contains"
  | "starts-with"
  | "ends-with"
  | "is-empty"
  | "is-not-empty"
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "before"
  | "after"
  | "on-or-before"
  | "on-or-after"
  | "is-checked"
  | "is-unchecked";

export type FilterLeaf = {
  op: FilterOperator;
  colId: string;
  value?: unknown;
};

export type FilterNode =
  | { combinator: "and" | "or"; children: FilterNode[] }
  | FilterLeaf;

export const isLeaf = (node: FilterNode): node is FilterLeaf =>
  (node as FilterLeaf).op !== undefined;

export type SortEntry = { colId: string; dir: "asc" | "desc" };

export type ConditionalColorRule = {
  id: string;
  filter: FilterNode;
  colorIdx: number;
};

export type DatabaseLayout = "table" | "board" | "gallery" | "list" | "calendar";

export type DatabaseView = {
  id: string;
  name: string;
  layout: DatabaseLayout;
  hiddenColumnIds: string[];
  filter: FilterNode;
  sorts: SortEntry[];
  groupBy?: string;
  conditionalColor?: ConditionalColorRule[];
  boardColumnColId?: string;
  calendarDateColId?: string;
  galleryCoverSource?: "cover" | "firstFile" | "none";
};

export type DatabaseElementData = {
  type: "database";
  id?: string;
  title: string;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  views?: DatabaseView[];
  activeViewId?: string;
  children: [{ text: "" }];
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const EMPTY_FILTER: FilterNode = { combinator: "and", children: [] };
