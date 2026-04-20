import { ChartRenderer } from "../chart-renderer";
import type { ChartConfigShape } from "../chart-utils";
import type { DatabaseColumn, DatabaseRow, DatabaseView } from "../types";

export const ChartLayout = ({
  view,
  columns,
  rows,
}: {
  view: DatabaseView;
  columns: DatabaseColumn[];
  rows: DatabaseRow[];
}) => {
  if (!view.chart) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-[13px] text-muted-foreground">
        Chart view is not configured yet. Open view settings to pick chart type, X and Y axes.
      </div>
    );
  }
  return (
    <div className="px-3 py-2">
      <ChartRenderer rows={rows} columns={columns} config={view.chart as ChartConfigShape} />
    </div>
  );
};
