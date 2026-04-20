import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import type { ColumnConfig } from "../types";

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  INR: "₹",
  GBP: "£",
  JPY: "¥",
};

export const NumberCell = ({
  value,
  onChange,
  config,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  config?: ColumnConfig;
}) => {
  const isCurrency = config?.kind === "currency";
  const symbol = isCurrency ? (CURRENCY_SYMBOL[(config as { code: string }).code] ?? "") : "";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value == null || value === "" ? "" : String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value == null || value === "" ? "" : String(value));
  }, [value, editing]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!editing) {
    const display =
      draft === ""
        ? "Empty"
        : isCurrency
          ? `${symbol}${Number(draft).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
          : draft;
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "block w-full truncate text-right text-[13px] tabular-nums outline-none",
          draft === "" && "text-muted-foreground/40",
        )}
      >
        {display}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="number"
      inputMode="decimal"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onChange(draft === "" ? "" : Number(draft));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setDraft(value == null ? "" : String(value));
          setEditing(false);
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className="-m-1 w-[calc(100%+0.5rem)] rounded-sm border-0 bg-background px-1 py-0.5 text-right text-[13px] tabular-nums outline-none ring-2 ring-ring/50"
    />
  );
};
