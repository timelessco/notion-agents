import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Value } from "platejs";

import { getPageByIdQueryOption } from "@/lib/server-fn/pages";
import type { DatabaseColumn } from "@/components/ui/database-node/types";
import { PageEditor } from "./page-editor";
import { RowPageProperties } from "./row-page-properties";

interface Props {
  pageId: string;
  parentId: string;
  initialContent: Value | null | undefined;
  initialTitle: string | null | undefined;
  initialIcon: string | null | undefined;
}

export const DocPageWithProperties = ({
  pageId,
  parentId,
  initialContent,
  initialTitle,
  initialIcon,
}: Props) => {
  const { data: parent } = useQuery(getPageByIdQueryOption(parentId));
  const parentPage = parent?.page;
  const isRowPage = parentPage?.kind === "database";
  const grandparentId = parentPage?.parentId ?? null;

  const { data: grandparent } = useQuery({
    ...getPageByIdQueryOption(grandparentId ?? ""),
    enabled: isRowPage && !!grandparentId,
  });

  const columns = useMemo<DatabaseColumn[] | null>(() => {
    if (!isRowPage || !grandparent) return null;
    const content = grandparent.page.content as Value | undefined;
    if (!content) return null;
    for (const node of content) {
      if (node.type === "database" && node.pageId === parentId) {
        return (node.columns as DatabaseColumn[]) ?? [];
      }
    }
    return null;
  }, [isRowPage, grandparent, parentId]);

  return (
    <div>
      {columns && columns.length > 0 && (
        <div className="mx-auto max-w-3xl px-6 pt-10">
          <RowPageProperties rowPageId={pageId} dbPageId={parentId} columns={columns} />
        </div>
      )}
      <PageEditor
        pageId={pageId}
        initialContent={initialContent}
        initialTitle={initialTitle}
        initialIcon={initialIcon}
      />
    </div>
  );
};
