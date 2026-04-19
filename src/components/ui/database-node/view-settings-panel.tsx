import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  EyeIcon,
  FilterIcon,
  LayoutGridIcon,
  LayoutListIcon,
  ListIcon,
  CalendarIcon,
  KanbanIcon,
  GalleryThumbnailsIcon,
  PaintbrushIcon,
  Plus,
  TableIcon,
  Trash2,
  XIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { CELL_REGISTRY } from "./registry";
import type {
  DatabaseColumn,
  DatabaseLayout,
  DatabaseView,
  FilterLeaf,
  FilterOperator,
  SortEntry,
} from "./types";
import { isLeaf, uid } from "./types";

const LAYOUT_META: Record<
  DatabaseLayout,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  table: { label: "Table", Icon: TableIcon },
  board: { label: "Board", Icon: KanbanIcon },
  gallery: { label: "Gallery", Icon: GalleryThumbnailsIcon },
  list: { label: "List", Icon: LayoutListIcon },
  calendar: { label: "Calendar", Icon: CalendarIcon },
};

const OP_LABEL: Record<FilterOperator, string> = {
  is: "is",
  "is-not": "is not",
  contains: "contains",
  "not-contains": "does not contain",
  "starts-with": "starts with",
  "ends-with": "ends with",
  "is-empty": "is empty",
  "is-not-empty": "is not empty",
  eq: "=",
  neq: "≠",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  before: "before",
  after: "after",
  "on-or-before": "on or before",
  "on-or-after": "on or after",
  "is-checked": "is checked",
  "is-unchecked": "is unchecked",
};

const Section = ({
  Icon,
  label,
  right,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-[13px] hover:bg-muted/40"
      >
        <Icon className="size-3.5 text-muted-foreground" />
        <span className="flex-1 text-left">{label}</span>
        {right && <span className="text-[12px] text-muted-foreground">{right}</span>}
        <ChevronRightIcon
          className={cn(
            "size-3.5 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
};

export const ViewSettingsPanel = ({
  open,
  onClose,
  view,
  columns,
  onUpdateView,
}: {
  open: boolean;
  onClose: () => void;
  view: DatabaseView;
  columns: DatabaseColumn[];
  onUpdateView: (patch: Partial<DatabaseView>) => void;
}) => {
  const leaves: FilterLeaf[] = isLeaf(view.filter)
    ? [view.filter]
    : view.filter.children.filter(isLeaf);

  const visibleCount = columns.filter((c) => !view.hiddenColumnIds.includes(c.id)).length;

  const addFilter = (colId: string) => {
    const col = columns.find((c) => c.id === colId);
    if (!col) return;
    const ops = CELL_REGISTRY[col.type].filterOperators ?? [];
    const op = (ops[0] ?? "is-not-empty") as FilterOperator;
    const newLeaf: FilterLeaf = { colId, op, value: "" };
    onUpdateView({
      filter: { combinator: "and", children: [...leaves, newLeaf] },
    });
  };

  const updateLeaf = (idx: number, patch: Partial<FilterLeaf>) => {
    const next = leaves.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    onUpdateView({ filter: { combinator: "and", children: next } });
  };

  const removeLeaf = (idx: number) => {
    const next = leaves.filter((_, i) => i !== idx);
    onUpdateView({ filter: { combinator: "and", children: next } });
  };

  const addSort = (colId: string) => {
    if (view.sorts.some((s) => s.colId === colId)) return;
    onUpdateView({ sorts: [...view.sorts, { colId, dir: "asc" }] });
  };

  const updateSort = (idx: number, patch: Partial<SortEntry>) => {
    onUpdateView({
      sorts: view.sorts.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    });
  };

  const removeSort = (idx: number) => {
    onUpdateView({ sorts: view.sorts.filter((_, i) => i !== idx) });
  };

  const toggleVisibility = (colId: string) => {
    onUpdateView({
      hiddenColumnIds: view.hiddenColumnIds.includes(colId)
        ? view.hiddenColumnIds.filter((x) => x !== colId)
        : [...view.hiddenColumnIds, colId],
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[360px] p-0 sm:max-w-[360px]">
        <SheetHeader className="border-b border-border/40 px-4 py-3">
          <SheetTitle className="text-[15px]">View settings</SheetTitle>
        </SheetHeader>
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <input
            value={view.name}
            onChange={(e) => onUpdateView({ name: e.target.value })}
            placeholder="View name"
            className="flex-1 rounded-sm border border-border bg-background px-2 py-1 text-[13px] outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <Section
          Icon={LAYOUT_META[view.layout].Icon}
          label="Layout"
          right={LAYOUT_META[view.layout].label}
        >
          <div className="grid grid-cols-5 gap-1">
            {(Object.keys(LAYOUT_META) as DatabaseLayout[]).map((l) => {
              const { Icon, label } = LAYOUT_META[l];
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => onUpdateView({ layout: l })}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md border border-border/40 p-2 text-[11px] hover:bg-accent/40",
                    view.layout === l && "bg-accent border-border",
                  )}
                >
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section Icon={EyeIcon} label="Property visibility" right={String(visibleCount)}>
          <div className="space-y-0.5">
            {columns.map((c) => {
              const hidden = view.hiddenColumnIds.includes(c.id);
              const Icon = CELL_REGISTRY[c.type].Icon;
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-[13px] hover:bg-accent/40"
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{c.name}</span>
                  <input
                    type="checkbox"
                    checked={!hidden}
                    onChange={() => toggleVisibility(c.id)}
                    className="size-3.5"
                  />
                </label>
              );
            })}
          </div>
        </Section>

        <Section
          Icon={FilterIcon}
          label="Filter"
          right={leaves.length > 0 ? String(leaves.length) : undefined}
        >
          <div className="space-y-1.5">
            {leaves.map((leaf, i) => {
              const col = columns.find((c) => c.id === leaf.colId);
              if (!col) return null;
              const ops = CELL_REGISTRY[col.type].filterOperators ?? [];
              const needsValue =
                leaf.op !== "is-empty" &&
                leaf.op !== "is-not-empty" &&
                leaf.op !== "is-checked" &&
                leaf.op !== "is-unchecked";
              return (
                <div
                  key={i}
                  className="flex items-center gap-1 rounded-sm border border-border/40 px-1.5 py-1"
                >
                  <span className="text-[12px] text-muted-foreground">{col.name}</span>
                  <select
                    value={leaf.op}
                    onChange={(e) =>
                      updateLeaf(i, { op: e.target.value as FilterOperator, value: "" })
                    }
                    className="bg-transparent text-[12px] outline-none"
                  >
                    {ops.map((op) => (
                      <option key={op} value={op}>
                        {OP_LABEL[op]}
                      </option>
                    ))}
                  </select>
                  {needsValue && (
                    <input
                      value={(leaf.value as string) ?? ""}
                      onChange={(e) => updateLeaf(i, { value: e.target.value })}
                      placeholder="value"
                      className="flex-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[12px] outline-none"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeLeaf(i)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove filter"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-[12px] text-muted-foreground hover:bg-accent/40"
                  >
                    <Plus className="size-3.5" />
                    Add filter
                  </button>
                }
              />
              <DropdownMenuContent align="start" className="w-48 p-1">
                {columns
                  .filter((c) => (CELL_REGISTRY[c.type].filterOperators ?? []).length > 0)
                  .map((c) => {
                    const Icon = CELL_REGISTRY[c.type].Icon;
                    return (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => addFilter(c.id)}
                        className="gap-2 text-[13px]"
                      >
                        <Icon className="size-3.5 text-muted-foreground" />
                        {c.name}
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Section>

        <Section
          Icon={ArrowUpIcon}
          label="Sort"
          right={view.sorts.length > 0 ? String(view.sorts.length) : undefined}
        >
          <div className="space-y-1.5">
            {view.sorts.map((s, i) => {
              const col = columns.find((c) => c.id === s.colId);
              if (!col) return null;
              return (
                <div
                  key={i}
                  className="flex items-center gap-1 rounded-sm border border-border/40 px-1.5 py-1 text-[12px]"
                >
                  <span className="flex-1 truncate">{col.name}</span>
                  <button
                    type="button"
                    onClick={() => updateSort(i, { dir: s.dir === "asc" ? "desc" : "asc" })}
                    className="flex items-center gap-0.5 rounded-sm px-1 py-0.5 text-muted-foreground hover:bg-accent"
                  >
                    {s.dir === "asc" ? (
                      <ArrowUpIcon className="size-3" />
                    ) : (
                      <ArrowDownIcon className="size-3" />
                    )}
                    {s.dir === "asc" ? "Asc" : "Desc"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSort(i)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-[12px] text-muted-foreground hover:bg-accent/40"
                  >
                    <Plus className="size-3.5" />
                    Add sort
                  </button>
                }
              />
              <DropdownMenuContent align="start" className="w-48 p-1">
                {columns
                  .filter((c) => CELL_REGISTRY[c.type].sortable)
                  .filter((c) => !view.sorts.some((s) => s.colId === c.id))
                  .map((c) => {
                    const Icon = CELL_REGISTRY[c.type].Icon;
                    return (
                      <DropdownMenuItem
                        key={c.id}
                        onClick={() => addSort(c.id)}
                        className="gap-2 text-[13px]"
                      >
                        <Icon className="size-3.5 text-muted-foreground" />
                        {c.name}
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Section>

        <Section
          Icon={ListIcon}
          label="Group"
          right={
            view.groupBy
              ? columns.find((c) => c.id === view.groupBy)?.name ?? "On"
              : "Off"
          }
        >
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onUpdateView({ groupBy: undefined })}
              className={cn(
                "rounded-sm px-2 py-1 text-left text-[13px] hover:bg-accent/40",
                !view.groupBy && "bg-accent",
              )}
            >
              No grouping
            </button>
            {columns
              .filter((c) => CELL_REGISTRY[c.type].groupable)
              .map((c) => {
                const Icon = CELL_REGISTRY[c.type].Icon;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onUpdateView({ groupBy: c.id })}
                    className={cn(
                      "flex items-center gap-2 rounded-sm px-2 py-1 text-left text-[13px] hover:bg-accent/40",
                      view.groupBy === c.id && "bg-accent",
                    )}
                  >
                    <Icon className="size-3.5 text-muted-foreground" />
                    {c.name}
                  </button>
                );
              })}
          </div>
        </Section>

        <Section Icon={PaintbrushIcon} label="Conditional color">
          <div className="px-1 py-2 text-[12px] text-muted-foreground">
            Coming soon.
          </div>
        </Section>
      </SheetContent>
    </Sheet>
  );
};

// Unused icon kept for future; silence TS unused warning.
void LayoutGridIcon;
void Trash2;
void uid;
