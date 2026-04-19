import type { ReactNode } from "react";
import { GripVertical, Maximize2, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { DatabaseColumn, DatabaseRow } from "./types";

export const DatabaseRowView = ({
  row,
  columns,
  renderCell,
  onDelete,
  onOpen,
  readOnly,
}: {
  row: DatabaseRow;
  columns: DatabaseColumn[];
  renderCell: (row: DatabaseRow, col: DatabaseColumn) => ReactNode;
  onDelete: () => void;
  onOpen: () => void;
  readOnly: boolean;
}) => (
  <div className="contents group/row">
    <div className="flex items-center justify-center border-b border-border/40 text-muted-foreground opacity-0 group-hover/row:opacity-100">
      {!readOnly && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label="Row actions"
                className="flex size-6 items-center justify-center rounded hover:bg-accent"
              >
                <GripVertical className="size-3.5" />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-40 p-1">
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 text-[13px] text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5" />
              Delete row
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
    {columns.map((col, i) => (
      <div
        key={col.id}
        className="min-w-0 border-b border-border/40 px-2 py-1.5 text-[13px] hover:bg-muted/20"
      >
        {i === 0 ? (
          <div className="flex items-center gap-1">
            <div className="min-w-0 flex-1">{renderCell(row, col)}</div>
            <button
              type="button"
              onClick={onOpen}
              aria-label="Open page"
              className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-accent group-hover/row:opacity-100"
            >
              <Maximize2 className="size-3" />
            </button>
          </div>
        ) : (
          renderCell(row, col)
        )}
      </div>
    ))}
    <div className="border-b border-border/40" />
  </div>
);
