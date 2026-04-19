import { useMemo } from "react";

import { cn } from "@/lib/utils";

import type { DatabaseColumn, DatabaseRow, DatabaseView } from "../types";

const formatDayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const CalendarLayout = ({
  view,
  columns,
  rows,
  onOpenRow,
}: {
  view: DatabaseView;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
  onOpenRow: (id: string) => void;
}) => {
  const dateColId =
    view.calendarDateColId ?? columns.find((c) => c.type === "date")?.id;
  const dateCol = columns.find((c) => c.id === dateColId);

  const { weeks, heading } = useMemo(() => {
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(today.getFullYear(), today.getMonth(), d) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null });
    const ws: { date: Date | null }[][] = [];
    for (let i = 0; i < cells.length; i += 7) ws.push(cells.slice(i, i + 7));
    const heading = today.toLocaleString(undefined, { month: "long", year: "numeric" });
    return { weeks: ws, heading };
  }, []);

  if (!dateCol || dateCol.type !== "date") {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-[13px] text-muted-foreground">
        Calendar view requires a Date column. Add one and choose it in view settings.
      </div>
    );
  }

  const byDay = new Map<string, DatabaseRow[]>();
  for (const r of rows) {
    const v = r.cells[dateCol.id];
    if (typeof v === "string" && v) {
      if (!byDay.has(v)) byDay.set(v, []);
      byDay.get(v)!.push(r);
    }
  }

  return (
    <div className="rounded-md border border-border/40 bg-background">
      <div className="border-b border-border/40 px-3 py-2 text-[13px] font-medium">
        {heading}
      </div>
      <div className="grid grid-cols-7 border-b border-border/40 bg-muted/20 text-[11px] font-medium text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="px-2 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((cell, i) => {
          const key = cell.date ? formatDayKey(cell.date) : `empty-${i}`;
          const dayRows = cell.date ? byDay.get(key) ?? [] : [];
          return (
            <div
              key={key}
              className={cn(
                "min-h-[96px] border-b border-r border-border/40 p-1 text-[11px]",
                !cell.date && "bg-muted/10",
              )}
            >
              {cell.date && (
                <>
                  <div className="mb-1 text-muted-foreground">{cell.date.getDate()}</div>
                  <div className="space-y-0.5">
                    {dayRows.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onOpenRow(r.id)}
                        className="block w-full truncate rounded-sm bg-accent/60 px-1.5 py-0.5 text-left hover:bg-accent"
                      >
                        {r.icon && <span className="mr-1">{r.icon}</span>}
                        {r.title && r.title.trim() ? r.title : "Untitled"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
