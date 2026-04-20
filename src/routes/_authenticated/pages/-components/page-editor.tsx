import { useCallback, useMemo, useRef } from "react";
import { normalizeNodeId } from "platejs";
import type { TElement, Value } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { PageEditorKit } from "@/components/editor/page-editor-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { createFormHeaderNode } from "@/components/ui/form-header-node";
import type { FormHeaderElementData } from "@/components/ui/form-header-node";
import { migrateEditorContent } from "@/lib/editor/migrate-editor-content";
import { EditorThemeProvider } from "@/contexts/editor-theme-context";
import { useResolvedTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { updatePage } from "@/lib/server-fn/pages";
import { getDatabaseRowsCollection } from "@/collections/query/database-rows";
import { useParentKind } from "@/hooks/use-parent-kind";

interface PageEditorProps {
  pageId: string;
  initialContent: Value | null | undefined;
  initialTitle: string | null | undefined;
  initialIcon: string | null | undefined;
}

const DEFAULT_EDITOR_VALUE = normalizeNodeId([
  createFormHeaderNode() as unknown as TElement,
  { children: [{ text: "" }], type: "p" },
]);

export const PageEditor = ({
  pageId,
  initialContent,
  initialTitle,
  initialIcon,
}: PageEditorProps) => {
  const resolvedAppTheme = useResolvedTheme();
  const queryClient = useQueryClient();
  const skipSaveRef = useRef(true);
  const params = useParams({ strict: false }) as { workspaceId?: string };
  const workspaceId = params.workspaceId;
  const parentInfo = useParentKind(pageId, workspaceId);
  const rowsCollection = useMemo(
    () =>
      parentInfo?.parentKind === "database" && workspaceId
        ? getDatabaseRowsCollection({
            queryClient,
            dbPageId: parentInfo.parentId,
            workspaceId,
          })
        : null,
    [parentInfo, workspaceId, queryClient],
  );

  const value = useMemo(() => {
    if (!initialContent || !Array.isArray(initialContent) || initialContent.length === 0) {
      return migrateEditorContent(DEFAULT_EDITOR_VALUE as Value, {
        title: initialTitle ?? "",
        icon: initialIcon ?? null,
      });
    }
    return migrateEditorContent(initialContent as Value, {
      title: initialTitle ?? "",
      icon: initialIcon ?? null,
    });
    // eslint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps -- mount-only
  }, []);

  const editor = usePlateEditor({ plugins: PageEditorKit, value });

  const debouncedSave = useDebouncedCallback(
    async (val: Value) => {
      const headerNode =
        val.length > 0 && val[0]?.type === "formHeader"
          ? (val[0] as unknown as FormHeaderElementData)
          : null;
      if (rowsCollection) {
        // Route through the rows collection so the parent database grid
        // sees title/icon/content updates via its live query.
        rowsCollection.update(pageId, (draft) => {
          draft.content = val as unknown as object[];
          if (headerNode) {
            draft.title = headerNode.title || "Untitled";
            draft.icon = headerNode.icon ?? null;
          }
        });
        return;
      }
      try {
        await updatePage({
          data: {
            id: pageId,
            content: val as unknown as unknown[],
            title: headerNode?.title,
            icon: headerNode?.icon ?? null,
          },
        });
        queryClient.invalidateQueries({ queryKey: ["pages", "list"] });
      } catch {
        // surface later via toast if needed
      }
    },
    { wait: 600 },
  );

  const handleChange = useCallback(
    ({ value: val }: { value: Value }) => {
      if (skipSaveRef.current) {
        skipSaveRef.current = false;
        return;
      }
      debouncedSave(val);
    },
    [debouncedSave],
  );

  const themeCtx = useMemo(
    () => ({ themeVars: {}, hasCustomization: false, customization: null }),
    [],
  );

  return (
    <EditorThemeProvider value={themeCtx}>
      <div
        className={cn(
          "min-h-full w-full overflow-x-hidden bg-background text-foreground",
          resolvedAppTheme === "dark" && "dark",
        )}
      >
        <Plate editor={editor} onChange={handleChange}>
          <EditorContainer
            variant="default"
            className="px-0 sm:px-0 max-w-full border-none shadow-none overflow-y-visible"
          >
            <Editor variant="demo" className="rounded-none" />
          </EditorContainer>
        </Plate>
      </div>
    </EditorThemeProvider>
  );
};

export default PageEditor;
