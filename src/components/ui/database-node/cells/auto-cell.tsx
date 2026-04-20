import type { DatabaseRow } from "../types";

const formatDateTime = (ts: number | undefined): string => {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const AutoTimeCell = ({
  row,
  kind,
}: {
  row: DatabaseRow;
  kind: "created-time" | "last-edited-time";
}) => {
  const ts = kind === "created-time" ? row.createdAt : row.updatedAt;
  return (
    <span className="block w-full truncate text-left text-[13px] text-muted-foreground tabular-nums">
      {formatDateTime(ts)}
    </span>
  );
};

export const AutoUserCell = () => (
  <span className="block w-full truncate text-left text-[13px] text-muted-foreground">You</span>
);
