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

import type { SelectOption } from "../types";

export const SelectCell = ({
  value,
  onChange,
  options,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  options: SelectOption[];
}) => {
  const current = options.find((o) => o.id === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-between gap-1 truncate rounded-sm text-left text-[13px] outline-none hover:bg-accent/40 focus:ring-2 focus:ring-ring/40"
          >
            {current ? (
              <span
                className={cn(
                  "inline-block truncate rounded-sm px-1.5 py-0.5 text-[12px]",
                  MULTI_SELECT_COLORS[current.colorIdx % MULTI_SELECT_COLORS.length].bg,
                  MULTI_SELECT_COLORS[current.colorIdx % MULTI_SELECT_COLORS.length].text,
                )}
              >
                {current.label}
              </span>
            ) : (
              <span className="text-muted-foreground/40">Empty</span>
            )}
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
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="gap-2 text-[13px]"
          >
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[12px]",
                MULTI_SELECT_COLORS[opt.colorIdx % MULTI_SELECT_COLORS.length].bg,
                MULTI_SELECT_COLORS[opt.colorIdx % MULTI_SELECT_COLORS.length].text,
              )}
            >
              {opt.label}
            </span>
            {value === opt.id && <span className="ml-auto text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
        {current && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onChange("")} className="gap-2 text-[13px]">
              <XIcon className="size-3.5" />
              Clear
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
