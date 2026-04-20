import { eq, useLiveQuery } from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { getPagesCollection } from "@/collections/query/pages";

export type ParentInfo = {
  parentId: string;
  parentKind: string;
} | null;

/**
 * Live-queries the pages collection for `pageId` self-joined against its parent.
 * Returns `{parentId, parentKind}` when the page has a parent, else null.
 *
 * Enables components to react to parent metadata (e.g. "is this page inside a
 * database?") without a separate fetch, and to stay in sync as parents change.
 */
export const useParentKind = (
  pageId: string | null | undefined,
  workspaceId: string | null | undefined,
): ParentInfo => {
  const queryClient = useQueryClient();

  const live = useLiveQuery(
    (q) => {
      if (!pageId || !workspaceId) return undefined;
      const pages = getPagesCollection({ queryClient, workspaceId });
      return q
        .from({ p: pages })
        .innerJoin({ parent: pages }, ({ p, parent }) => eq(p.parentId, parent.id))
        .where(({ p }) => eq(p.id, pageId))
        .select(({ parent }) => ({
          parentId: parent.id,
          parentKind: parent.kind,
        }));
    },
    [pageId, workspaceId, queryClient],
  );

  return live?.data?.[0] ?? null;
};
