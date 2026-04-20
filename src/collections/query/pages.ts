import { createCollection } from "@tanstack/db";
import type { QueryClient } from "@tanstack/query-core";
import { queryCollectionOptions } from "@tanstack/query-db-collection";

import {
  createPage,
  deletePage,
  listWorkspacePagesQueryOption,
  updatePage,
} from "@/lib/server-fn/pages";

export type PageListItem = {
  id: string;
  title: string;
  icon: string | null;
  kind: string;
  parentId: string | null;
  updatedAt: string;
};

type Config = {
  queryClient: QueryClient;
  workspaceId: string;
};

const cache = new Map<string, ReturnType<typeof buildCollection>>();

const buildCollection = ({ queryClient, workspaceId }: Config) => {
  const options = listWorkspacePagesQueryOption(workspaceId);

  return createCollection(
    queryCollectionOptions<PageListItem, unknown, readonly unknown[], string | number>({
      id: `pages:${workspaceId}`,
      queryKey: options.queryKey,
      queryFn: async () => {
        const result = await queryClient.fetchQuery(options);
        return result.pages;
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
            parentId: m.parentId ?? undefined,
            kind: m.kind === "database" ? "database" : "doc",
            title: m.title,
            icon: m.icon ?? null,
          },
        });
      },
      onUpdate: async ({ transaction }) => {
        for (const mut of transaction.mutations) {
          const c = mut.changes as Partial<PageListItem>;
          await updatePage({
            data: {
              id: mut.original.id,
              ...(c.title !== undefined ? { title: c.title } : {}),
              ...(c.icon !== undefined ? { icon: c.icon ?? null } : {}),
            },
          });
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

export const getPagesCollection = (config: Config) => {
  const existing = cache.get(config.workspaceId);
  if (existing) return existing;
  const created = buildCollection(config);
  cache.set(config.workspaceId, created);
  return created;
};
