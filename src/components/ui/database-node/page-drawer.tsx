import type { Value } from "platejs";
import { Maximize2, MoreHorizontal, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";

import { DatabasePageView } from "./page-view";
import type { ColumnType, DatabaseColumn, DatabaseRow } from "./types";

type Props = {
  open: boolean;
  onClose: () => void;
  onMaximize: () => void;
  row: DatabaseRow | null;
  columns: DatabaseColumn[];
  allRows: DatabaseRow[];
  readOnly: boolean;
  onIconChange: (rowId: string, icon: string | undefined) => void;
  onCoverChange: (rowId: string, cover: string | undefined) => void;
  onTitleChange: (rowId: string, title: string) => void;
  onContentChange: (rowId: string, value: Value) => void;
  onCellChange: (rowId: string, colId: string, value: unknown) => void;
  onAddColumn: (type: ColumnType) => void;
  onDeleteRow: (rowId: string) => void;
};

const DatabasePageDrawer = ({
  open,
  onClose,
  onMaximize,
  row,
  columns,
  allRows,
  readOnly,
  onIconChange,
  onCoverChange,
  onTitleChange,
  onContentChange,
  onCellChange,
  onAddColumn,
  onDeleteRow,
}: Props) => {
  if (!row) return null;
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-[min(760px,95vw)] p-0 sm:max-w-[760px]">
        <div className="flex h-full flex-col" onMouseDown={(e) => e.stopPropagation()}>
          <DatabasePageView
            row={row}
            columns={columns}
            allRows={allRows}
            readOnly={readOnly}
            compact
            onIconChange={onIconChange}
            onCoverChange={onCoverChange}
            onTitleChange={onTitleChange}
            onContentChange={onContentChange}
            onCellChange={onCellChange}
            onAddColumn={onAddColumn}
            toolbar={
              <div className="flex items-center justify-end gap-1 border-b border-border/40 px-2 py-1.5">
                <button
                  type="button"
                  onClick={onMaximize}
                  className="flex size-7 items-center justify-center rounded hover:bg-accent"
                  aria-label="Open as page"
                >
                  <Maximize2 className="size-3.5 text-muted-foreground" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="flex size-7 items-center justify-center rounded hover:bg-accent"
                        aria-label="More"
                      >
                        <MoreHorizontal className="size-3.5 text-muted-foreground" />
                      </button>
                    }
                  />
                  <DropdownMenuContent align="end" className="w-40 p-1">
                    <DropdownMenuItem
                      onClick={() => {
                        onDeleteRow(row.id);
                        onClose();
                      }}
                      className="gap-2 text-[13px] text-destructive focus:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      Delete row
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DatabasePageDrawer;
