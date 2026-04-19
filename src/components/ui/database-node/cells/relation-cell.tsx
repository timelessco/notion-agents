import { useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

import type { DatabaseRow } from "../types";

const asIds = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

const rowLabel = (row: DatabaseRow): string =>
  row.title && row.title.trim().length > 0 ? row.title : "Untitled";

export const RelationCell = ({
  value,
  onChange,
  rowId,
  allRows,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  rowId: string;
  allRows: DatabaseRow[];
}) => {
  const ids = asIds(value);
  const candidates = allRows.filter((r) => r.id !== rowId);
  const [query, setQuery] = useState("");
  const visible = query
    ? candidates.filter((r) => rowLabel(r).toLowerCase().includes(query.toLowerCase()))
    : candidates;

  const toggle = (id: string) => {
    onChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  };
  const remove = (id: string) => onChange(ids.filter((x) => x !== id));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-between gap-1 rounded-sm text-left text-[13px] outline-none hover:bg-accent/40"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              {ids.length === 0 ? (
                <span className="text-muted-foreground/40">Empty</span>
              ) : (
                ids.map((id) => {
                  const r = allRows.find((x) => x.id === id);
                  if (!r) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-sm bg-accent/60 px-1.5 py-0.5 text-[12px]"
                    >
                      <span className="max-w-[120px] truncate">{rowLabel(r)}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(id);
                        }}
                        className="hover:opacity-70"
                        aria-label="Remove"
                      >
                        <XIcon className="size-2.5" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>
            <ChevronDown className="size-3 shrink-0 text-muted-foreground/60" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-64 p-1">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pages..."
          autoFocus
          onKeyDown={(e) => e.stopPropagation()}
          className={cn(
            "mb-1 w-full rounded-sm border border-border bg-background px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-ring/40",
          )}
        />
        {visible.length === 0 && (
          <div className="px-2 py-1.5 text-[12px] text-muted-foreground">No matches.</div>
        )}
        {visible.map((r) => {
          const checked = ids.includes(r.id);
          return (
            <DropdownMenuItem
              key={r.id}
              onClick={() => toggle(r.id)}
              onSelect={(e) => e.preventDefault()}
              className="gap-2 text-[13px]"
            >
              <span className="truncate">{rowLabel(r)}</span>
              {checked && <span className="ml-auto text-muted-foreground">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
