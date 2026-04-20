import type { ComponentType, ReactNode } from "react";
import {
  AtSignIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  CalendarRangeIcon,
  CaseSensitiveIcon,
  CheckSquareIcon,
  ChevronsRightIcon,
  ClockIcon,
  DollarSignIcon,
  HashIcon as LucideHashIcon,
  HeartIcon,
  LinkIcon,
  ListChecksIcon,
  PaperclipIcon,
  PhoneIcon,
  SigmaIcon,
  StarIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";

import { AutoTimeCell, AutoUserCell } from "./cells/auto-cell";
import { CheckboxCell } from "./cells/checkbox-cell";
import { DateCell } from "./cells/date-cell";
import { DateRangeCell, TimeCell } from "./cells/date-range-cell";
import { FileCell } from "./cells/file-cell";
import { FormulaCell } from "./cells/formula-cell";
import { LinearScaleCell, RatingCell } from "./cells/rating-cell";
import { MultiSelectCell, StatusCell } from "./cells/multi-select-cell";
import { NumberCell } from "./cells/number-cell";
import { RelationCell } from "./cells/relation-cell";
import { RollupCell } from "./cells/rollup-cell";
import { SelectCell } from "./cells/select-cell";
import { TextCell } from "./cells/text-cell";
import type {
  ColumnType,
  DatabaseColumn,
  DatabaseRow,
  FilterOperator,
  SelectOption,
} from "./types";

export type CellProps = {
  value: unknown;
  onChange: (v: unknown) => void;
  column: DatabaseColumn;
  row: DatabaseRow;
  allRows: DatabaseRow[];
  columns: DatabaseColumn[];
};

export type CellRegistryEntry = {
  Icon: ComponentType<{ className?: string }>;
  label: string;
  coerce: (v: unknown, column: DatabaseColumn) => unknown;
  Cell: ComponentType<CellProps>;
  PageField?: ComponentType<CellProps>;
  isComputed?: boolean;
  sortable?: boolean;
  groupable?: boolean;
  filterOperators?: FilterOperator[];
};

const EMPTY_OPTIONS: SelectOption[] = [];

const noCoerce = (v: unknown) => v ?? "";

const TEXT_OPS: FilterOperator[] = [
  "is",
  "is-not",
  "contains",
  "not-contains",
  "starts-with",
  "ends-with",
  "is-empty",
  "is-not-empty",
];
const NUM_OPS: FilterOperator[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "is-empty",
  "is-not-empty",
];
const SELECT_OPS: FilterOperator[] = ["is", "is-not", "is-empty", "is-not-empty"];
const MULTI_OPS: FilterOperator[] = ["contains", "not-contains", "is-empty", "is-not-empty"];
const DATE_OPS: FilterOperator[] = [
  "is",
  "is-not",
  "before",
  "after",
  "on-or-before",
  "on-or-after",
  "is-empty",
  "is-not-empty",
];
const CHECK_OPS: FilterOperator[] = ["is-checked", "is-unchecked"];

export const CELL_REGISTRY: Record<ColumnType, CellRegistryEntry> = {
  title: {
    Icon: CaseSensitiveIcon,
    label: "Name",
    coerce: (_v, _column) => undefined,
    Cell: ({ row, onChange }) => <TextCell value={row.title ?? ""} onChange={onChange} />,
    sortable: true,
    filterOperators: TEXT_OPS,
  },
  text: {
    Icon: CaseSensitiveIcon,
    label: "Text",
    coerce: noCoerce,
    Cell: ({ value, onChange }) => <TextCell value={value} onChange={onChange} />,
    sortable: true,
    filterOperators: TEXT_OPS,
  },
  email: {
    Icon: AtSignIcon,
    label: "Email",
    coerce: noCoerce,
    Cell: ({ value, onChange }) => <TextCell value={value} onChange={onChange} mode="email" />,
    sortable: true,
    filterOperators: TEXT_OPS,
  },
  phone: {
    Icon: PhoneIcon,
    label: "Phone",
    coerce: noCoerce,
    Cell: ({ value, onChange }) => <TextCell value={value} onChange={onChange} mode="phone" />,
    sortable: true,
    filterOperators: TEXT_OPS,
  },
  url: {
    Icon: LinkIcon,
    label: "URL",
    coerce: noCoerce,
    Cell: ({ value, onChange }) => <TextCell value={value} onChange={onChange} mode="url" />,
    sortable: true,
    filterOperators: TEXT_OPS,
  },
  number: {
    Icon: LucideHashIcon,
    label: "Number",
    coerce: (v) => (v === "" || v == null ? "" : Number(v)),
    Cell: ({ value, onChange }) => <NumberCell value={value} onChange={onChange} />,
    sortable: true,
    filterOperators: NUM_OPS,
  },
  currency: {
    Icon: DollarSignIcon,
    label: "Currency",
    coerce: (v) => (v === "" || v == null ? "" : Number(v)),
    Cell: ({ value, onChange, column }) => (
      <NumberCell value={value} onChange={onChange} config={column.config} />
    ),
    sortable: true,
    filterOperators: NUM_OPS,
  },
  rating: {
    Icon: StarIcon,
    label: "Rating",
    coerce: (v) => (typeof v === "number" ? v : 0),
    Cell: ({ value, onChange, column }) => (
      <RatingCell value={value} onChange={onChange} config={column.config} />
    ),
    sortable: true,
    groupable: true,
    filterOperators: NUM_OPS,
  },
  "linear-scale": {
    Icon: ChevronsRightIcon,
    label: "Linear scale",
    coerce: (v) => (typeof v === "number" ? v : ""),
    Cell: ({ value, onChange, column }) => (
      <LinearScaleCell value={value} onChange={onChange} config={column.config} />
    ),
    sortable: true,
    filterOperators: NUM_OPS,
  },
  select: {
    Icon: TagIcon,
    label: "Select",
    coerce: (v) => (typeof v === "string" ? v : ""),
    Cell: ({ value, onChange, column }) => (
      <SelectCell value={value} onChange={onChange} options={column.options ?? EMPTY_OPTIONS} />
    ),
    sortable: true,
    groupable: true,
    filterOperators: SELECT_OPS,
  },
  "multi-select": {
    Icon: TagIcon,
    label: "Multi-select",
    coerce: (v) => (Array.isArray(v) ? v : []),
    Cell: ({ value, onChange, column }) => (
      <MultiSelectCell
        value={value}
        onChange={onChange}
        options={column.options ?? EMPTY_OPTIONS}
      />
    ),
    filterOperators: MULTI_OPS,
  },
  status: {
    Icon: WorkflowIcon,
    label: "Status",
    coerce: (v) => (typeof v === "string" ? v : ""),
    Cell: ({ value, onChange, column }) => (
      <StatusCell
        value={value}
        onChange={onChange}
        config={column.config}
        options={column.options ?? EMPTY_OPTIONS}
      />
    ),
    sortable: true,
    groupable: true,
    filterOperators: SELECT_OPS,
  },
  checkbox: {
    Icon: CheckSquareIcon,
    label: "Checkbox",
    coerce: (v) => Boolean(v),
    Cell: ({ value, onChange }) => <CheckboxCell value={value} onChange={onChange} />,
    sortable: true,
    groupable: true,
    filterOperators: CHECK_OPS,
  },
  date: {
    Icon: CalendarDaysIcon,
    label: "Date",
    coerce: (v) => v ?? "",
    Cell: ({ value, onChange }) => <DateCell value={value} onChange={onChange} />,
    sortable: true,
    filterOperators: DATE_OPS,
  },
  "date-range": {
    Icon: CalendarRangeIcon,
    label: "Date range",
    coerce: (v) => v ?? { start: "" },
    Cell: ({ value, onChange }) => <DateRangeCell value={value} onChange={onChange} />,
    sortable: true,
    filterOperators: DATE_OPS,
  },
  time: {
    Icon: ClockIcon,
    label: "Time",
    coerce: (v) => (typeof v === "string" ? v : ""),
    Cell: ({ value, onChange }) => <TimeCell value={value} onChange={onChange} />,
    sortable: true,
    filterOperators: TEXT_OPS,
  },
  file: {
    Icon: PaperclipIcon,
    label: "File",
    coerce: (v) => (Array.isArray(v) ? v : []),
    Cell: ({ value, onChange }) => <FileCell value={value} onChange={onChange} />,
    filterOperators: ["is-empty", "is-not-empty"],
  },
  relation: {
    Icon: UsersIcon,
    label: "Relation",
    coerce: (v) => (Array.isArray(v) ? v : []),
    Cell: ({ value, onChange, row, allRows }) => (
      <RelationCell value={value} onChange={onChange} rowId={row.id} allRows={allRows} />
    ),
    filterOperators: MULTI_OPS,
  },
  formula: {
    Icon: SigmaIcon,
    label: "Formula",
    coerce: () => undefined,
    Cell: ({ row, columns, column }) => (
      <FormulaCell row={row} columns={columns} config={column.config} />
    ),
    isComputed: true,
    filterOperators: [...TEXT_OPS, ...NUM_OPS],
  },
  rollup: {
    Icon: CalculatorIcon,
    label: "Rollup",
    coerce: () => undefined,
    Cell: ({ row, columns, column, allRows }) => (
      <RollupCell row={row} columns={columns} allRows={allRows} config={column.config} />
    ),
    isComputed: true,
    filterOperators: [...TEXT_OPS, ...NUM_OPS],
  },
  "created-time": {
    Icon: ClockIcon,
    label: "Created time",
    coerce: () => undefined,
    Cell: ({ row }) => <AutoTimeCell row={row} kind="created-time" />,
    isComputed: true,
    sortable: true,
    filterOperators: DATE_OPS,
  },
  "created-by": {
    Icon: UserIcon,
    label: "Created by",
    coerce: () => undefined,
    Cell: () => <AutoUserCell />,
    isComputed: true,
  },
  "last-edited-time": {
    Icon: ClockIcon,
    label: "Last edited time",
    coerce: () => undefined,
    Cell: ({ row }) => <AutoTimeCell row={row} kind="last-edited-time" />,
    isComputed: true,
    sortable: true,
    filterOperators: DATE_OPS,
  },
  "last-edited-by": {
    Icon: UserIcon,
    label: "Last edited by",
    coerce: () => undefined,
    Cell: () => <AutoUserCell />,
    isComputed: true,
  },
};

export const COLUMN_TYPES = Object.keys(CELL_REGISTRY) as ColumnType[];
export const USER_SELECTABLE_TYPES = COLUMN_TYPES.filter((t) => t !== "title");

/** Legacy re-export. */
export const TYPE_META: Record<
  ColumnType,
  { label: string; Icon: ComponentType<{ className?: string }> }
> = Object.fromEntries(
  (Object.entries(CELL_REGISTRY) as [ColumnType, CellRegistryEntry][]).map(([t, entry]) => [
    t,
    { label: entry.label, Icon: entry.Icon },
  ]),
) as Record<ColumnType, { label: string; Icon: ComponentType<{ className?: string }> }>;

export const HeartIconAlias = HeartIcon;
export const ListChecksIconAlias = ListChecksIcon;

export const renderCellFromRegistry = (
  column: DatabaseColumn,
  row: DatabaseRow,
  allRows: DatabaseRow[],
  columns: DatabaseColumn[],
  onChange: (v: unknown) => void,
): ReactNode => {
  const entry = CELL_REGISTRY[column.type];
  const Cell = entry.Cell;
  return (
    <Cell
      value={row.cells[column.id]}
      onChange={onChange}
      column={column}
      row={row}
      allRows={allRows}
      columns={columns}
    />
  );
};
