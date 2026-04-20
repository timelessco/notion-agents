import { useMemo } from "react";
import { MoreHorizontal, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MULTI_SELECT_COLORS } from "@/components/ui/form-option-item-node";
import { cn } from "@/lib/utils";

import { ColumnHeaderMenu } from "../column-header";
import { CELL_REGISTRY, USER_SELECTABLE_TYPES } from "../registry";
import { DatabaseRowView } from "../row-view";
import type { GroupedRows } from "../filters";
import type { ColumnType, DatabaseColumn, DatabaseRow } from "../types";

export const TableLayout = ({
  visibleColumns,
  groups,
  readOnly,
  emptyLabel,
  conditionalColor,
  renderCell,
  onAddRow,
  onDeleteRow,
  onOpenRow,
  onAddColumn,
  onRenameColumn,
  onChangeColumnType,
  onDeleteColumn,
  onAddSelectOption,
  onRenameSelectOption,
  onDeleteSelectOption,
  openColumnMenu,
  setOpenColumnMenu,
  onResizeColumn,
}: {
  visibleColumns: DatabaseColumn[];
  groups: GroupedRows;
  readOnly: boolean;
  emptyLabel: string;
  conditionalColor: (row: DatabaseRow) => number | null;
  renderCell: (row: DatabaseRow, col: DatabaseColumn) => React.ReactNode;
  onAddRow: (groupKeyId?: string) => void;
  onDeleteRow: (id: string) => void;
  onOpenRow: (id: string) => void;
  onAddColumn: (type: ColumnType) => void;
  onRenameColumn: (id: string, name: string) => void;
  onChangeColumnType: (id: string, type: ColumnType) => void;
  onDeleteColumn: (id: string) => void;
  onAddSelectOption: (colId: string, label: string) => void;
  onRenameSelectOption: (colId: string, optionId: string, label: string) => void;
  onDeleteSelectOption: (colId: string, optionId: string) => void;
  openColumnMenu: string | null;
  setOpenColumnMenu: (id: string | null) => void;
  onResizeColumn?: (id: string, width: number) => void;
}) => {
  const gridTemplate = useMemo(
    () =>
      ["32px", ...visibleColumns.map((c) => `${c.width ?? 160}px`), "minmax(40px, 1fr)"].join(" "),
    [visibleColumns],
  );

  const totalCells = visibleColumns.length + 2;

  return (
    <div className="overflow-x-auto rounded-md border border-border/70 bg-background">
      <div className="inline-grid min-w-full" style={{ gridTemplateColumns: gridTemplate }}>
        <div className="sticky top-0 z-10 border-b border-border/70 bg-muted/30" />
        {visibleColumns.map((col) => {
          const { Icon } = CELL_REGISTRY[col.type];
          return (
            <div key={col.id} className="relative">
              <DropdownMenu
                open={openColumnMenu === col.id}
                onOpenChange={(open) => setOpenColumnMenu(open ? col.id : null)}
              >
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      disabled={readOnly}
                      className="group/col flex w-full items-center gap-1.5 border-b border-border/70 bg-muted/30 px-2 py-1.5 text-left text-[12px] font-medium text-muted-foreground hover:bg-muted/60"
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="truncate">{col.name}</span>
                      <MoreHorizontal className="ml-auto size-3.5 opacity-0 group-hover/col:opacity-100" />
                    </button>
                  }
                />
                <ColumnHeaderMenu
                  column={col}
                  onRename={(n) => onRenameColumn(col.id, n)}
                  onChangeType={(t) => onChangeColumnType(col.id, t)}
                  onDelete={() => {
                    onDeleteColumn(col.id);
                    setOpenColumnMenu(null);
                  }}
                  onAddOption={(label) => onAddSelectOption(col.id, label)}
                  onRenameOption={(optionId, label) =>
                    onRenameSelectOption(col.id, optionId, label)
                  }
                  onDeleteOption={(optionId) => onDeleteSelectOption(col.id, optionId)}
                />
              </DropdownMenu>
              {!readOnly && onResizeColumn && (
                <div
                  role="separator"
                  aria-label={`Resize ${col.name}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startW = col.width ?? 160;
                    const move = (ev: MouseEvent) => {
                      const next = Math.max(60, startW + (ev.clientX - startX));
                      onResizeColumn(col.id, next);
                    };
                    const up = () => {
                      window.removeEventListener("mousemove", move);
                      window.removeEventListener("mouseup", up);
                    };
                    window.addEventListener("mousemove", move);
                    window.addEventListener("mouseup", up);
                  }}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 hover:bg-primary/40 hover:opacity-100"
                />
              )}
            </div>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                disabled={readOnly}
                aria-label="Add property"
                className="flex items-center justify-center border-b border-border/70 bg-muted/30 px-2 py-1.5 text-muted-foreground hover:bg-muted/60"
              >
                <Plus className="size-3.5" />
              </button>
            }
          />
          <DropdownMenuContent
            align="end"
            className="max-h-[360px] w-44 overflow-y-auto p-1"
            sideOffset={6}
          >
            <div className="px-1.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              New property
            </div>
            {USER_SELECTABLE_TYPES.map((t) => {
              const { Icon, label } = CELL_REGISTRY[t];
              return (
                <DropdownMenuItem
                  key={t}
                  onClick={() => onAddColumn(t)}
                  className="gap-2 text-[13px]"
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  {label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {groups.every((g) => g.rows.length === 0) && (
          <div
            className="col-span-full flex items-center justify-center py-8 text-[12px] text-muted-foreground"
            style={{ gridColumn: `1 / ${totalCells + 1}` }}
          >
            {emptyLabel}
          </div>
        )}

        {groups.map((group) => (
          <div key={group.key.id} className="contents">
            {group.key.id !== "__all" && (
              <div
                className="col-span-full flex items-center gap-2 border-b border-border/40 bg-muted/20 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                style={{ gridColumn: `1 / ${totalCells + 1}` }}
              >
                {group.key.label}
                <span className="text-muted-foreground/60">{group.rows.length}</span>
              </div>
            )}
            {group.rows.map((row) => {
              const colorIdx = conditionalColor(row);
              const color =
                colorIdx == null
                  ? null
                  : MULTI_SELECT_COLORS[colorIdx % MULTI_SELECT_COLORS.length];
              return (
                <div key={row.id} className={cn("contents", color && color.bg)}>
                  <DatabaseRowView
                    row={row}
                    columns={visibleColumns}
                    renderCell={renderCell}
                    onDelete={() => onDeleteRow(row.id)}
                    onOpen={() => onOpenRow(row.id)}
                    readOnly={readOnly}
                  />
                </div>
              );
            })}
            {!readOnly && (
              <button
                type="button"
                onClick={() => onAddRow(group.key.id === "__all" ? undefined : group.key.id)}
                className={cn(
                  "col-span-full flex items-center gap-1.5 px-2 py-1.5 text-left text-[12px] text-muted-foreground hover:bg-muted/30",
                )}
                style={{ gridColumn: `1 / ${totalCells + 1}` }}
              >
                <Plus className="size-3.5" />
                New
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
