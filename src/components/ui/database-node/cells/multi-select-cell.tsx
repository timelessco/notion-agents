import { ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { XIcon } from "@/components/ui/icons";
import { MULTI_SELECT_COLORS } from "@/components/ui/form-option-item-node";
import { cn } from "@/lib/utils";

import type { ColumnConfig, SelectOption } from "../types";

const asArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

export const MultiSelectCell = ({
  value,
  onChange,
  options,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  options: SelectOption[];
}) => {
  const ids = asArray(value);
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
            className="flex w-full items-center justify-between gap-1 rounded-sm text-left text-[13px] outline-none hover:bg-accent/40 focus:ring-2 focus:ring-ring/40"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-1">
              {ids.length === 0 ? (
                <span className="text-muted-foreground/40">Empty</span>
              ) : (
                ids.map((id) => {
                  const opt = options.find((o) => o.id === id);
                  if (!opt) return null;
                  const color = MULTI_SELECT_COLORS[opt.colorIdx % MULTI_SELECT_COLORS.length];
                  return (
                    <span
                      key={id}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[12px]",
                        color.bg,
                        color.text,
                      )}
                    >
                      {opt.label}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="hover:opacity-70"
                        aria-label={`Remove ${opt.label}`}
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
      <DropdownMenuContent align="start" className="w-48 p-1">
        {options.length === 0 && (
          <div className="px-2 py-1.5 text-[12px] text-muted-foreground">
            No options. Add some in the column menu.
          </div>
        )}
        {options.map((opt) => {
          const color = MULTI_SELECT_COLORS[opt.colorIdx % MULTI_SELECT_COLORS.length];
          const checked = ids.includes(opt.id);
          return (
            <DropdownMenuItem
              key={opt.id}
              onClick={() => toggle(opt.id)}
              onSelect={(e) => e.preventDefault()}
              className="gap-2 text-[13px]"
            >
              <span className={cn("rounded-sm px-1.5 py-0.5 text-[12px]", color.bg, color.text)}>
                {opt.label}
              </span>
              {checked && <span className="ml-auto text-muted-foreground">✓</span>}
            </DropdownMenuItem>
          );
        })}
        {ids.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange([])} className="gap-2 text-[13px]">
              <XIcon className="size-3.5" />
              Clear all
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const StatusCell = ({
  value,
  onChange,
  config,
  options,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  config?: ColumnConfig;
  options: SelectOption[];
}) => {
  const id = typeof value === "string" ? value : "";
  const current = options.find((o) => o.id === id);
  const groups = config?.kind === "status" ? config.groups : [];
  const color = current
    ? MULTI_SELECT_COLORS[current.colorIdx % MULTI_SELECT_COLORS.length]
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-between gap-1 truncate rounded-sm text-left text-[13px] outline-none hover:bg-accent/40"
          >
            {current && color ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px]",
                  color.bg,
                  color.text,
                )}
              >
                <span className={cn("inline-block size-1.5 rounded-full", color.text.replace("text-", "bg-"))} />
                {current.label}
              </span>
            ) : (
              <span className="text-muted-foreground/40">Not started</span>
            )}
            <ChevronDown className="size-3 shrink-0 text-muted-foreground/60" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-56 p-1">
        {groups.length === 0 && (
          <div className="px-2 py-1.5 text-[12px] text-muted-foreground">
            No status groups configured.
          </div>
        )}
        {groups.map((group) => (
          <div key={group.id}>
            <div className="px-2 pt-1.5 pb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {group.label}
            </div>
            {group.options.map((opt) => {
              const c = MULTI_SELECT_COLORS[opt.colorIdx % MULTI_SELECT_COLORS.length];
              return (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => onChange(opt.id)}
                  className="gap-2 text-[13px]"
                >
                  <span className={cn("inline-block size-1.5 rounded-full", c.text.replace("text-", "bg-"))} />
                  <span>{opt.label}</span>
                  {id === opt.id && <span className="ml-auto text-muted-foreground">✓</span>}
                </DropdownMenuItem>
              );
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
