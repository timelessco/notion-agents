import { MULTI_SELECT_COLORS } from "@/components/ui/form-option-item-node";
import { cn } from "@/lib/utils";

import { CELL_REGISTRY } from "../registry";
import type { DatabaseColumn, DatabaseRow } from "../types";

export const ListLayout = ({
  visibleColumns,
  rows,
  conditionalColor,
  onOpenRow,
  renderCell,
}: {
  visibleColumns: DatabaseColumn[];
  rows: DatabaseRow[];
  conditionalColor: (row: DatabaseRow) => number | null;
  onOpenRow: (id: string) => void;
  renderCell: (row: DatabaseRow, col: DatabaseColumn) => React.ReactNode;
}) => {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-[13px] text-muted-foreground">
        No rows match this view.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/40 rounded-md border border-border/40 bg-background">
      {rows.map((row) => {
        const cc = conditionalColor(row);
        const rowColor = cc == null ? null : MULTI_SELECT_COLORS[cc % MULTI_SELECT_COLORS.length];
        return (
          <div
            key={row.id}
            onClick={() => onOpenRow(row.id)}
            className={cn(
              "flex cursor-pointer items-center gap-3 px-3 py-1.5 text-[13px] hover:bg-muted/30",
              rowColor && rowColor.bg,
            )}
          >
            {row.icon && <span className="text-base">{row.icon}</span>}
            <span className="min-w-0 max-w-[40%] flex-1 truncate font-medium">
              {row.title && row.title.trim() ? row.title : "Untitled"}
            </span>
            <div className="flex min-w-0 flex-[2] items-center gap-3 text-muted-foreground">
              {visibleColumns.slice(0, 4).map((c) => {
                const Icon = CELL_REGISTRY[c.type].Icon;
                return (
                  <div
                    key={c.id}
                    className="flex min-w-0 items-center gap-1.5 text-[12px]"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Icon className="size-3 shrink-0" />
                    <div className="min-w-0 max-w-[140px] flex-1 truncate">
                      {renderCell(row, c)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
