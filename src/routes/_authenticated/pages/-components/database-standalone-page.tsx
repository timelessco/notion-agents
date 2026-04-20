import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plate, usePlateEditor } from "platejs/react";
import type { TElement, Value } from "platejs";
import { normalizeNodeId } from "platejs";

import { PageEditorKit } from "@/components/editor/page-editor-kit";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { EditorThemeProvider } from "@/contexts/editor-theme-context";
import { getPageByIdQueryOption } from "@/lib/server-fn/pages";
import { Loader2Icon } from "@/components/ui/icons";

interface Props {
  dbPageId: string;
  parentPageId: string;
  title: string;
}

export const DatabaseStandalonePage = ({ dbPageId, parentPageId, title }: Props) => {
  const { data: parent, isLoading } = useQuery(getPageByIdQueryOption(parentPageId));

  const dbNode = useMemo<TElement | null>(() => {
    const content = parent?.page.content as Value | undefined;
    if (!content) return null;
    for (const node of content) {
      if (node.type === "database" && node.pageId === dbPageId) return node as TElement;
    }
    return null;
  }, [parent, dbPageId]);

  const value = useMemo(() => {
    if (!dbNode) return null;
    return normalizeNodeId([dbNode]);
  }, [dbNode]);

  const editor = usePlateEditor({ plugins: PageEditorKit, value: value ?? [] }, [value]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!value) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-semibold text-3xl tracking-tight">{title || "Untitled database"}</h1>
        <p className="mt-6 text-muted-foreground text-sm">
          Couldn't find this database on its parent page.{" "}
          <Link to="/pages/$pageId" params={{ pageId: parentPageId }} className="underline">
            Open parent page
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <EditorThemeProvider value={{ themeVars: {}, hasCustomization: false, customization: null }}>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-semibold text-3xl tracking-tight">{title || "Untitled database"}</h1>
          <Link
            to="/pages/$pageId"
            params={{ pageId: parentPageId }}
            className="text-muted-foreground text-sm underline"
          >
            Open parent page ↗
          </Link>
        </div>
        <Plate editor={editor} readOnly>
          <EditorContainer
            variant="default"
            className="px-0 sm:px-0 max-w-full border-none shadow-none overflow-y-visible"
          >
            <Editor variant="demo" className="rounded-none" readOnly />
          </EditorContainer>
        </Plate>
      </div>
    </EditorThemeProvider>
  );
};
