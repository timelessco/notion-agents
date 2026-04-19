import type { Value } from "platejs";
import { ArrowLeft, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DatabasePageView } from "./page-view";
import type { ColumnType, DatabaseColumn, DatabaseRow } from "./types";

type Props = {
  onClose: () => void;
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

const DatabasePageOverlay = ({
  onClose,
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
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById("database-page-host");
    setHost(el);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!row || !host) return null;

  return createPortal(
    <div
      className="absolute inset-0 z-30 flex flex-col bg-background"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <DatabasePageView
        row={row}
        columns={columns}
        allRows={allRows}
        readOnly={readOnly}
        onIconChange={onIconChange}
        onCoverChange={onCoverChange}
        onTitleChange={onTitleChange}
        onContentChange={onContentChange}
        onCellChange={onCellChange}
        onAddColumn={onAddColumn}
        toolbar={
          <div className="flex items-center justify-between gap-1 border-b border-border/40 bg-background/95 px-3 py-2 backdrop-blur">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-[13px] text-muted-foreground hover:bg-accent"
            >
              <ArrowLeft className="size-3.5" />
              Back
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
    </div>,
    host,
  );
};

export default DatabasePageOverlay;
