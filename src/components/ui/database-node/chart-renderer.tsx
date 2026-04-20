import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { aggregateRows, buildChartConfigForSeries } from "./chart-utils";
import type { ChartConfigShape } from "./chart-utils";
import type { DatabaseColumn, DatabaseRow } from "./types";

export const ChartRenderer = ({
  rows,
  columns,
  config,
  className,
}: {
  rows: DatabaseRow[];
  columns: DatabaseColumn[];
  config: ChartConfigShape;
  className?: string;
}) => {
  const xCol = columns.find((c) => c.id === config.xColId);
  if (!xCol) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-[13px] text-muted-foreground">
        Pick an X axis column in chart settings.
      </div>
    );
  }
  if (config.agg !== "count" && !config.yColId) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-[13px] text-muted-foreground">
        Pick a Y axis column or change aggregation to Count.
      </div>
    );
  }

  const { data, seriesKeys, seriesLabels } = aggregateRows(rows, columns, config);
  const chartConfig = buildChartConfigForSeries(seriesKeys, seriesLabels);

  if (data.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-[13px] text-muted-foreground">
        No data to chart.
      </div>
    );
  }

  const showLegend = seriesKeys.length > 1;

  if (config.type === "pie" || config.type === "donut") {
    // Pie: flatten to one value per x bucket summed across series
    const pieData = data.map((pt) => {
      let total = 0;
      for (const sk of seriesKeys) total += Number(pt[sk] ?? 0);
      return { name: pt.xLabel, key: pt.x, value: total };
    });
    const pieConfig = buildChartConfigForSeries(
      pieData.map((p) => p.key),
      Object.fromEntries(pieData.map((p) => [p.key, p.name])),
    );
    return (
      <ChartContainer config={pieConfig} className={className}>
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            innerRadius={config.type === "donut" ? 60 : 0}
            outerRadius={100}
          >
            {pieData.map((entry, idx) => (
              <Cell
                key={entry.key}
                fill={`var(--color-${entry.key})`}
                stroke={`var(--color-${entry.key})`}
                fillOpacity={0.85 - (idx % 5) * 0.05}
              />
            ))}
          </Pie>
          <Legend content={<ChartLegendContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
    );
  }

  const Axes = (
    <>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis dataKey="xLabel" tickLine={false} axisLine={false} tickMargin={8} />
      <YAxis tickLine={false} axisLine={false} width={36} />
      <ChartTooltip content={<ChartTooltipContent />} />
      {showLegend && <Legend content={<ChartLegendContent />} />}
    </>
  );

  if (config.type === "line") {
    return (
      <ChartContainer config={chartConfig} className={className}>
        <LineChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 8 }}>
          {Axes}
          {seriesKeys.map((sk) => (
            <Line
              key={sk}
              dataKey={sk}
              type="monotone"
              stroke={`var(--color-${sk})`}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    );
  }

  if (config.type === "area") {
    return (
      <ChartContainer config={chartConfig} className={className}>
        <AreaChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 8 }}>
          {Axes}
          {seriesKeys.map((sk) => (
            <Area
              key={sk}
              dataKey={sk}
              type="monotone"
              stroke={`var(--color-${sk})`}
              fill={`var(--color-${sk})`}
              fillOpacity={0.25}
              stackId={seriesKeys.length > 1 ? "a" : undefined}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={chartConfig} className={className}>
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 8 }}>
        {Axes}
        {seriesKeys.map((sk) => (
          <Bar
            key={sk}
            dataKey={sk}
            fill={`var(--color-${sk})`}
            radius={[4, 4, 0, 0]}
            stackId={seriesKeys.length > 1 ? "a" : undefined}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
};
