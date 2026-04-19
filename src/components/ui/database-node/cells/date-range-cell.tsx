import { cn } from "@/lib/utils";

import type { DateRangeValue } from "../types";

const asRange = (v: unknown): DateRangeValue => {
  if (v && typeof v === "object" && "start" in (v as object)) {
    const { start, end } = v as { start?: unknown; end?: unknown };
    return {
      start: typeof start === "string" ? start : "",
      end: typeof end === "string" ? end : undefined,
    };
  }
  return { start: "" };
};

export const DateRangeCell = ({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) => {
  const range = asRange(value);
  return (
    <div
      className="flex items-center gap-1"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <input
        type="date"
        value={range.start}
        onChange={(e) => onChange({ ...range, start: e.target.value })}
        className={cn(
          "flex-1 rounded-sm border-0 bg-transparent px-1 py-0.5 text-[12px] tabular-nums outline-none focus:ring-2 focus:ring-ring/40",
          !range.start && "text-muted-foreground/40",
        )}
      />
      <span className="text-muted-foreground">→</span>
      <input
        type="date"
        value={range.end ?? ""}
        onChange={(e) => onChange({ ...range, end: e.target.value || undefined })}
        className={cn(
          "flex-1 rounded-sm border-0 bg-transparent px-1 py-0.5 text-[12px] tabular-nums outline-none focus:ring-2 focus:ring-ring/40",
          !range.end && "text-muted-foreground/40",
        )}
      />
    </div>
  );
};

export const TimeCell = ({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) => {
  const str = typeof value === "string" ? value : "";
  return (
    <input
      type="time"
      value={str}
      onChange={(e) => onChange(e.target.value)}
      onMouseDown={(e) => e.stopPropagation()}
      className={cn(
        "-m-1 w-[calc(100%+0.5rem)] rounded-sm border-0 bg-transparent px-1 py-0.5 text-[13px] tabular-nums outline-none focus:ring-2 focus:ring-ring/40",
        !str && "text-muted-foreground/40",
      )}
    />
  );
};
