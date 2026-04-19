import { MULTI_SELECT_COLORS } from "@/components/ui/form-option-item-node";
import { cn } from "@/lib/utils";

import { CELL_REGISTRY } from "../registry";
import type { DatabaseColumn, DatabaseRow, DatabaseView } from "../types";

const pickCover = (row: DatabaseRow, columns: DatabaseColumn[], source: string | undefined): string | null => {
  if (source === "none") return null;
  if (source === "firstFile") {
    for (const c of columns) {
      if (c.type === "file") {
        const v = row.cells[c.id];
        if (Array.isArray(v) && v.length > 0) {
          const first = v[0] as { url?: string };
          if (first?.url) return first.url;
        }
      }
    }
    return null;
  }
  return row.cover ?? null;
};

export const GalleryLayout = ({
  view,
  columns,
  visibleColumns,
  rows,
  conditionalColor,
  onOpenRow,
  renderCell,
}: {
  view: DatabaseView;
  columns: DatabaseColumn[];
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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
      {rows.map((row) => {
        const cover = pickCover(row, columns, view.galleryCoverSource);
        const cc = conditionalColor(row);
        const rowColor = cc == null ? null : MULTI_SELECT_COLORS[cc % MULTI_SELECT_COLORS.length];
        return (
          <div
            key={row.id}
            onClick={() => onOpenRow(row.id)}
            className={cn(
              "cursor-pointer overflow-hidden rounded-md border border-border/40 bg-background shadow-sm hover:border-border",
              rowColor && rowColor.bg,
            )}
          >
            {cover ? (
              <div
                className="h-28 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${cover})` }}
              />
            ) : (
              <div className="h-24 w-full bg-muted/40" />
            )}
            <div className="p-2">
              <div className="flex items-center gap-1.5">
                {row.icon && <span className="text-base">{row.icon}</span>}
                <span className="truncate text-[13px] font-medium">
                  {row.title && row.title.trim() ? row.title : "Untitled"}
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {visibleColumns.slice(0, 3).map((c) => {
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
          </div>
        );
      })}
    </div>
  );
};
