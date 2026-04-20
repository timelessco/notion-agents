import { Heart, Star } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ColumnConfig } from "../types";

export const RatingCell = ({
  value,
  onChange,
  config,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  config?: ColumnConfig;
}) => {
  const max = config?.kind === "rating" ? config.max : 5;
  const Icon = config?.kind === "rating" && config.style === "heart" ? Heart : Star;
  const v = typeof value === "number" ? value : 0;

  return (
    <div className="flex items-center gap-0.5" onMouseDown={(e) => e.stopPropagation()}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < v;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(v === i + 1 ? 0 : i + 1)}
            aria-label={`Set rating to ${i + 1}`}
            className="rounded-sm p-0.5 text-muted-foreground/40 hover:bg-muted/40"
          >
            <Icon className={cn("size-3.5", filled && "fill-amber-400 text-amber-400")} />
          </button>
        );
      })}
    </div>
  );
};

export const LinearScaleCell = ({
  value,
  onChange,
  config,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  config?: ColumnConfig;
}) => {
  const { min, max, step } =
    config?.kind === "linear-scale" ? config : { min: 1, max: 10, step: 1 };
  const v = typeof value === "number" ? value : "";
  return (
    <div className="flex items-center gap-1.5" onMouseDown={(e) => e.stopPropagation()}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v === "" ? min : v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 accent-primary"
      />
      <span className="w-6 text-right text-[11px] tabular-nums text-muted-foreground">
        {v === "" ? "—" : v}
      </span>
    </div>
  );
};
