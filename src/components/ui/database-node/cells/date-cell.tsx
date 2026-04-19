import { cn } from "@/lib/utils";

export const DateCell = ({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) => {
  const str = typeof value === "string" ? value : "";
  return (
    <input
      type="date"
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
