import { Plus } from "lucide-react";

import { MULTI_SELECT_COLORS } from "@/components/ui/form-option-item-node";
import { cn } from "@/lib/utils";

import { CELL_REGISTRY } from "../registry";
import type {
  DatabaseColumn,
  DatabaseRow,
  DatabaseView,
  SelectOption,
} from "../types";

export const BoardLayout = ({
  view,
  columns,
  visibleColumns,
  rows,
  readOnly,
  conditionalColor,
  onOpenRow,
  onAddRow,
  onCellChange,
  renderCell,
}: {
  view: DatabaseView;
  columns: DatabaseColumn[];
  visibleColumns: DatabaseColumn[];
  rows: DatabaseRow[];
  readOnly: boolean;
  conditionalColor: (row: DatabaseRow) => number | null;
  onOpenRow: (id: string) => void;
  onAddRow: (seed?: { colId: string; value: unknown }) => void;
  onCellChange: (rowId: string, colId: string, value: unknown) => void;
  renderCell: (row: DatabaseRow, col: DatabaseColumn) => React.ReactNode;
}) => {
  const boardColId =
    view.boardColumnColId ??
    columns.find((c) => c.type === "select" || c.type === "status")?.id;
  const boardCol = columns.find((c) => c.id === boardColId);

  if (!boardCol || (boardCol.type !== "select" && boardCol.type !== "status")) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-[13px] text-muted-foreground">
        Board view requires a Select or Status column. Add one and choose it in view settings.
      </div>
    );
  }

  const options: SelectOption[] = boardCol.options ?? [];
  const byOption = new Map<string, DatabaseRow[]>();
  const uncategorized: DatabaseRow[] = [];
  for (const opt of options) byOption.set(opt.id, []);
  for (const row of rows) {
    const v = row.cells[boardCol.id];
    if (typeof v === "string" && byOption.has(v)) byOption.get(v)!.push(row);
    else uncategorized.push(row);
  }

  const otherColumns = visibleColumns.filter((c) => c.id !== boardCol.id);

  const moveToColumn = (rowId: string, optId: string) => {
    onCellChange(rowId, boardCol.id, optId);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {[
        { id: "__none", label: "No status", colorIdx: 0, rows: uncategorized },
        ...options.map((o) => ({
          id: o.id,
          label: o.label,
          colorIdx: o.colorIdx,
          rows: byOption.get(o.id) ?? [],
        })),
      ].map((col) => {
        const color = MULTI_SELECT_COLORS[col.colorIdx % MULTI_SELECT_COLORS.length];
        return (
          <div
            key={col.id}
            className="flex w-[260px] shrink-0 flex-col rounded-md border border-border/40 bg-muted/10"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const rowId = e.dataTransfer.getData("text/plain");
              if (rowId && col.id !== "__none") moveToColumn(rowId, col.id);
            }}
          >
            <div className="flex items-center gap-1.5 border-b border-border/40 px-2 py-1.5 text-[12px] font-medium">
              <span
                className={cn("rounded-sm px-1.5 py-0.5 text-[11px]", color.bg, color.text)}
              >
                {col.label}
              </span>
              <span className="text-muted-foreground">{col.rows.length}</span>
            </div>
            <div className="flex flex-col gap-1.5 p-2">
              {col.rows.map((row) => {
                const cc = conditionalColor(row);
                const rowColor =
                  cc == null ? null : MULTI_SELECT_COLORS[cc % MULTI_SELECT_COLORS.length];
                return (
                  <div
                    key={row.id}
                    draggable={!readOnly}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", row.id)}
                    onClick={() => onOpenRow(row.id)}
                    className={cn(
                      "cursor-pointer rounded-md border border-border/40 bg-background p-2 text-[13px] shadow-sm hover:border-border",
                      rowColor && rowColor.bg,
                    )}
                  >
                    {row.icon && <div className="mb-1 text-lg">{row.icon}</div>}
                    <div className="font-medium">
                      {row.title && row.title.trim() ? row.title : "Untitled"}
                    </div>
                    <div className="mt-1 flex flex-col gap-1">
                      {otherColumns.slice(0, 4).map((c) => {
                        const Icon = CELL_REGISTRY[c.type].Icon;
                        return (
                          <div
                            key={c.id}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <Icon className="size-3 shrink-0" />
                            <div className="min-w-0 flex-1 truncate">
                              {renderCell(row, c)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {!readOnly && col.id !== "__none" && (
                <button
                  type="button"
                  onClick={() =>
                    onAddRow({ colId: boardCol.id, value: col.id === "__none" ? "" : col.id })
                  }
                  className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-[12px] text-muted-foreground hover:bg-accent/40"
                >
                  <Plus className="size-3.5" />
                  New
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
