import { useCallback, useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useLiveQuery, eq } from "@tanstack/react-db";

import { renderCellFromRegistry, CELL_REGISTRY } from "@/components/ui/database-node/registry";
import type { DatabaseColumn, DatabaseRow } from "@/components/ui/database-node/types";
import { getDatabaseRowsCollection } from "@/collections/query/database-rows";

interface Props {
  rowPageId: string;
  dbPageId: string;
  columns: DatabaseColumn[];
}

export const RowPageProperties = ({ rowPageId, dbPageId, columns }: Props) => {
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { workspaceId?: string };
  const workspaceId = params.workspaceId;

  const collection = useMemo(
    () => (workspaceId ? getDatabaseRowsCollection({ queryClient, dbPageId, workspaceId }) : null),
    [queryClient, dbPageId, workspaceId],
  );

  const live = useLiveQuery(
    (q) => {
      if (!collection) return undefined;
      return q.from({ r: collection }).where(({ r }) => eq(r.id, rowPageId));
    },
    [collection, rowPageId],
  );

  const record = live?.data?.[0];

  const cells = useMemo<Record<string, unknown>>(() => {
    const meta = (record?.meta as { cells?: Record<string, unknown> } | null) ?? null;
    return meta?.cells ?? {};
  }, [record?.meta]);

  const fauxRow = useMemo<DatabaseRow>(() => ({ id: rowPageId, cells }), [rowPageId, cells]);

  const onChange = useCallback(
    (colId: string, value: unknown) => {
      if (!collection) return;
      collection.update(rowPageId, (draft) => {
        const metaObj = (draft.meta as Record<string, unknown> | null) ?? {};
        const prevCells = (metaObj as { cells?: Record<string, unknown> }).cells ?? {};
        draft.meta = { ...metaObj, cells: { ...prevCells, [colId]: value } };
      });
    },
    [collection, rowPageId],
  );

  const visibleColumns = columns.filter((c) => c.type !== "title");
  if (visibleColumns.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-1.5 rounded-md border border-border/40 bg-background/50 p-3">
      {visibleColumns.map((col) => {
        const meta = CELL_REGISTRY[col.type];
        const Icon = meta?.Icon;
        return (
          <div key={col.id} className="flex items-center gap-3 text-sm">
            <div className="flex w-40 shrink-0 items-center gap-1.5 text-muted-foreground">
              {Icon ? <Icon className="size-3.5" /> : null}
              <span className="truncate">{col.name}</span>
            </div>
            <div className="min-w-0 flex-1">
              {renderCellFromRegistry(col, fauxRow, [fauxRow], columns, (v) => onChange(col.id, v))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
