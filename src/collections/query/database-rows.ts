import { createCollection } from "@tanstack/db";
import type { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

import {
  createPage,
  deletePage,
  listDatabaseRowsQueryOption,
  updatePage,
} from "@/lib/server-fn/pages";
import type { DatabaseRowRecord } from "@/lib/server-fn/pages";

type Config = {
  queryClient: QueryClient;
  dbPageId: string;
  workspaceId: string;
};

const cache = new Map<string, ReturnType<typeof buildCollection>>();

const buildCollection = ({ queryClient, dbPageId, workspaceId }: Config) => {
  const options = listDatabaseRowsQueryOption(dbPageId);

  return createCollection(
    queryCollectionOptions<DatabaseRowRecord, unknown, readonly unknown[], string | number>({
      id: `database-rows:${dbPageId}`,
      queryKey: options.queryKey,
      queryFn: async () => {
        const result = await queryClient.fetchQuery(options);
        return result.rows;
      },
      queryClient,
      getKey: (item): string | number => item.id,
      staleTime: 1000 * 60,
      onInsert: async ({ transaction }) => {
        const m = transaction.mutations[0].modified;
        await createPage({
          data: {
            id: m.id,
            workspaceId,
            parentId: dbPageId,
            kind: "doc",
            title: m.title ?? "Untitled",
            icon: m.icon ?? null,
            cover: m.cover ?? null,
            content: (m.content as unknown[]) ?? [],
            meta: (m.meta as Record<string, unknown> | null) ?? null,
          },
        });
      },
      onUpdate: async ({ transaction }) => {
        for (const mut of transaction.mutations) {
          const patch: Parameters<typeof updatePage>[0] extends undefined
            ? never
            : NonNullable<Parameters<typeof updatePage>[0]>["data"] = { id: mut.original.id };
          const c = mut.changes as Partial<DatabaseRowRecord>;
          if (c.title !== undefined) patch.title = c.title ?? "Untitled";
          if (c.icon !== undefined) patch.icon = c.icon ?? null;
          if (c.cover !== undefined) patch.cover = c.cover ?? null;
          if (c.content !== undefined) patch.content = c.content as unknown[];
          if (c.meta !== undefined) patch.meta = (c.meta as Record<string, unknown> | null) ?? null;
          await updatePage({ data: patch });
        }
      },
      onDelete: async ({ transaction }) => {
        for (const mut of transaction.mutations) {
          await deletePage({ data: { id: mut.original.id } });
        }
      },
    }),
  );
};

export const getDatabaseRowsCollection = (config: Config) => {
  const existing = cache.get(config.dbPageId);
  if (existing) return existing;
  const created = buildCollection(config);
  cache.set(config.dbPageId, created);
  return created;
};

export const clearDatabaseRowsCollection = (dbPageId: string) => {
  cache.delete(dbPageId);
};
