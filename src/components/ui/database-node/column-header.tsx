import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { XIcon } from "@/components/ui/icons";
import { MULTI_SELECT_COLORS } from "@/components/ui/form-option-item-node";
import { cn } from "@/lib/utils";

import { CELL_REGISTRY, COLUMN_TYPES } from "./registry";
import type { ColumnType, DatabaseColumn } from "./types";

export const ColumnHeaderMenu = ({
  column,
  onRename,
  onChangeType,
  onDelete,
  onAddOption,
  onRenameOption,
  onDeleteOption,
}: {
  column: DatabaseColumn;
  onRename: (name: string) => void;
  onChangeType: (type: ColumnType) => void;
  onDelete: () => void;
  onAddOption: (label: string) => void;
  onRenameOption: (optionId: string, label: string) => void;
  onDeleteOption: (optionId: string) => void;
}) => {
  const [draftName, setDraftName] = useState(column.name);
  const [newOption, setNewOption] = useState("");
  useEffect(() => setDraftName(column.name), [column.name]);

  return (
    <DropdownMenuContent className="w-64 p-1.5" align="start" sideOffset={6}>
      <div className="px-1 pb-1.5">
        <input
          value={draftName}
          autoFocus
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={() => {
            if (draftName.trim()) onRename(draftName.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          className="w-full rounded-sm border border-border bg-background px-2 py-1 text-[13px] outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>
      {column.type !== "title" && (
        <>
          <div className="px-1.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Property type
          </div>
          {COLUMN_TYPES.filter((t) => t !== "title").map((t) => {
            const { Icon, label } = CELL_REGISTRY[t];
            return (
              <DropdownMenuItem
                key={t}
                onClick={() => onChangeType(t)}
                className="gap-2 text-[13px]"
              >
                <Icon className="size-3.5 text-muted-foreground" />
                {label}
                {column.type === t && <span className="ml-auto text-muted-foreground">✓</span>}
              </DropdownMenuItem>
            );
          })}
        </>
      )}
      {column.type === "select" && (
        <>
          <DropdownMenuSeparator />
          <div className="px-1.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Options
          </div>
          <div className="flex flex-col gap-0.5 px-1 pb-1.5">
            {(column.options ?? []).map((opt) => {
              const color = MULTI_SELECT_COLORS[opt.colorIdx % MULTI_SELECT_COLORS.length];
              return (
                <div key={opt.id} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "flex-1 rounded-sm px-1.5 py-0.5 text-[12px]",
                      color.bg,
                      color.text,
                    )}
                  >
                    <input
                      defaultValue={opt.label}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== opt.label) {
                          onRenameOption(opt.id, e.target.value.trim());
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          (e.currentTarget as HTMLInputElement).blur();
                        }
                      }}
                      className="w-full bg-transparent outline-none"
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteOption(opt.id)}
                    className="size-5 rounded hover:bg-accent flex items-center justify-center text-muted-foreground"
                    aria-label={`Delete ${opt.label}`}
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              );
            })}
            <div className="flex items-center gap-1.5">
              <input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = newOption.trim();
                    if (v) {
                      onAddOption(v);
                      setNewOption("");
                    }
                  }
                }}
                placeholder="New option..."
                className="flex-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[12px] outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
        </>
      )}
      {column.type !== "title" && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            className="gap-2 text-[13px] text-destructive focus:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Delete property
          </DropdownMenuItem>
        </>
      )}
    </DropdownMenuContent>
  );
};
