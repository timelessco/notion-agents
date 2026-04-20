import { useMemo, useState } from "react";
import type { Value } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { PlateElement, useEditorRef, useReadOnly } from "platejs/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "@tanstack/react-db";
import { useParams } from "@tanstack/react-router";
import { BarChart3Icon, DatabaseIcon, Settings2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getPageByIdQueryOption,
  listDatabasesForWorkspaceQueryOption,
} from "@/lib/server-fn/pages";

import { getDatabaseRowsCollection } from "@/collections/query/database-rows";
import { ChartRenderer } from "./database-node/chart-renderer";
import { ChartSettingsForm, defaultChartConfig } from "./database-node/chart-settings-form";
import type { ChartConfigShape } from "./database-node/chart-utils";
import type { DatabaseColumn, DatabaseRow } from "./database-node/types";

export interface ChartEmbedElementData {
  type: "chartEmbed";
  id?: string;
  databasePageId?: string;
  title?: string;
  chart?: ChartConfigShape;
  children: [{ text: "" }];
}

export const createChartEmbedNode = (data: {
  databasePageId?: string;
  title?: string;
  chart?: ChartConfigShape;
}): ChartEmbedElementData => ({
  type: "chartEmbed",
  databasePageId: data.databasePageId,
  title: data.title,
  chart: data.chart,
  children: [{ text: "" }],
});

const findDatabaseColumns = (
  content: Value | undefined,
  databasePageId: string,
): { columns: DatabaseColumn[]; title: string } | null => {
  if (!content) return null;
  for (const node of content) {
    if (node.type === "database" && (node as { pageId?: string }).pageId === databasePageId) {
      return {
        columns: ((node as { columns?: DatabaseColumn[] }).columns ?? []) as DatabaseColumn[],
        title: ((node as { title?: string }).title ?? "") as string,
      };
    }
  }
  return null;
};

export const ChartEmbedElement = (props: PlateElementProps) => {
  const { element, children } = props;
  const readOnly = useReadOnly();
  const editor = useEditorRef();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { workspaceId?: string; pageId?: string };
  const workspaceId = params.workspaceId;
  const currentPageId = params.pageId ?? null;

  const databasePageId = element.databasePageId as string | undefined;
  const storedChart = element.chart as ChartConfigShape | undefined;
  const title = (element.title as string | undefined) ?? "";

  const patch = (data: Partial<ChartEmbedElementData>) => {
    if (readOnly) return;
    const path = editor.api.findPath(element);
    if (path) editor.tf.setNodes(data, { at: path });
  };

  const dbPageQuery = useQuery({
    ...getPageByIdQueryOption(databasePageId ?? ""),
    enabled: !!databasePageId,
  });

  const parentPageId = dbPageQuery.data?.page.parentId ?? null;
  const parentPageQuery = useQuery({
    ...getPageByIdQueryOption(parentPageId ?? ""),
    enabled: !!parentPageId,
  });

  const schema = useMemo(() => {
    if (!databasePageId) return null;
    return findDatabaseColumns(
      parentPageQuery.data?.page.content as Value | undefined,
      databasePageId,
    );
  }, [parentPageQuery.data, databasePageId]);

  const columns = schema?.columns ?? [];

  const rowsCollection = useMemo(
    () =>
      databasePageId && workspaceId
        ? getDatabaseRowsCollection({ queryClient, dbPageId: databasePageId, workspaceId })
        : null,
    [databasePageId, workspaceId, queryClient],
  );

  const liveRecords = useLiveQuery(
    (q) => {
      if (!rowsCollection) return undefined;
      return q.from({ r: rowsCollection });
    },
    [rowsCollection],
  );

  const rows = useMemo<DatabaseRow[]>(() => {
    const records = (liveRecords?.data ?? []) as Array<{
      id: string;
      title: string;
      icon: string | null;
      cover: string | null;
      content: object[];
      meta: Record<string, unknown> | null;
      createdAt: string;
      updatedAt: string;
    }>;
    return records.map((rec) => ({
      id: rec.id,
      pageId: rec.id,
      title: rec.title === "Untitled" ? "" : rec.title,
      icon: rec.icon ?? undefined,
      cover: rec.cover ?? undefined,
      cells: ((rec.meta as { cells?: Record<string, unknown> } | null)?.cells ?? {}) as Record<
        string,
        unknown
      >,
      createdAt: Date.parse(rec.createdAt),
      updatedAt: Date.parse(rec.updatedAt),
    }));
  }, [liveRecords?.data]);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const effectiveChart = storedChart ?? (columns.length > 0 ? defaultChartConfig(columns) : null);

  const headerTitle = title || schema?.title || dbPageQuery.data?.page.title || "Untitled database";

  return (
    <PlateElement {...props} className={cn("clear-both my-3", props.className)}>
      <div contentEditable={false} role="presentation" className="select-none">
        {!databasePageId ? (
          <ChartEmbedPicker
            workspaceId={workspaceId}
            currentPageId={currentPageId}
            onPick={(id, pickedTitle) => patch({ databasePageId: id, title: pickedTitle })}
          />
        ) : (
          <div className="rounded-md border bg-card">
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <BarChart3Icon className="size-4 text-muted-foreground" />
              <span className="text-[13px] font-medium">{headerTitle}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">Chart</span>
              {!readOnly && columns.length > 0 && (
                <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <PopoverTrigger
                    render={
                      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-[12px]">
                        <Settings2Icon className="size-3.5" />
                        Configure
                      </Button>
                    }
                  />
                  <PopoverContent align="end" className="w-[360px] p-3">
                    <ChartSettingsForm
                      columns={columns}
                      config={effectiveChart ?? defaultChartConfig(columns)}
                      onChange={(next) => patch({ chart: next })}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="p-3">
              {columns.length === 0 ? (
                <div className="rounded-md border border-dashed border-border/60 p-6 text-center text-[13px] text-muted-foreground">
                  Loading database schema…
                </div>
              ) : effectiveChart ? (
                <ChartRenderer rows={rows} columns={columns} config={effectiveChart} />
              ) : null}
            </div>
          </div>
        )}
      </div>
      {children}
    </PlateElement>
  );
};

const ChartEmbedPicker = ({
  workspaceId,
  currentPageId,
  onPick,
}: {
  workspaceId: string | undefined;
  currentPageId: string | null;
  onPick: (databasePageId: string, title: string) => void;
}) => {
  const listQuery = useQuery({
    ...listDatabasesForWorkspaceQueryOption(workspaceId ?? "", currentPageId),
    enabled: !!workspaceId,
  });

  if (!workspaceId) {
    return (
      <div className="rounded-md border border-dashed px-4 py-6 text-center text-muted-foreground text-sm">
        Chart embed is only available inside a workspace.
      </div>
    );
  }

  const databases = listQuery.data?.databases ?? [];
  const siblings = databases.filter((d) => d.isSibling);
  const others = databases.filter((d) => !d.isSibling);

  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center gap-2 text-[13px] font-medium">
        <BarChart3Icon className="size-4 text-muted-foreground" />
        Pick a database to chart
      </div>
      {listQuery.isLoading ? (
        <div className="text-[12px] text-muted-foreground">Loading…</div>
      ) : databases.length === 0 ? (
        <div className="text-[12px] text-muted-foreground">
          No databases found in this workspace. Create one first.
        </div>
      ) : (
        <div className="space-y-2">
          {siblings.length > 0 && (
            <Group label="On this page" items={siblings} onPick={(d) => onPick(d.id, d.title)} />
          )}
          {others.length > 0 && (
            <Group label="Workspace" items={others} onPick={(d) => onPick(d.id, d.title)} />
          )}
        </div>
      )}
    </div>
  );
};

const Group = ({
  label,
  items,
  onPick,
}: {
  label: string;
  items: Array<{ id: string; title: string; icon: string | null }>;
  onPick: (d: { id: string; title: string; icon: string | null }) => void;
}) => (
  <div>
    <div className="mb-1 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className="flex flex-col gap-0.5">
      {items.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onPick(d)}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px] hover:bg-accent/40"
        >
          {d.icon ? (
            <span>{d.icon}</span>
          ) : (
            <DatabaseIcon className="size-3.5 text-muted-foreground" />
          )}
          <span className="truncate">{d.title || "Untitled database"}</span>
        </button>
      ))}
    </div>
  </div>
);
