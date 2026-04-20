import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Value } from "platejs";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import Loader from "@/components/ui/loader";
import { NotFound } from "@/components/ui/not-found";
import { getPageByIdQueryOption } from "@/lib/server-fn/pages";
import { PageEditor } from "./-components/page-editor";
import { DatabaseStandalonePage } from "./-components/database-standalone-page";
import { DocPageWithProperties } from "./-components/doc-page-with-properties";

const PageView = () => {
  const { pageId } = Route.useParams();
  const { data } = useSuspenseQuery(getPageByIdQueryOption(pageId));
  const page = data.page;

  if (page.kind === "database") {
    if (!page.parentId) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h1 className="font-semibold text-3xl tracking-tight">
            {page.title || "Untitled database"}
          </h1>
          <p className="mt-6 text-muted-foreground text-sm">
            This database has no parent page. Insert it inside a page to view it.
          </p>
        </div>
      );
    }
    return (
      <DatabaseStandalonePage
        key={page.id}
        dbPageId={page.id}
        parentPageId={page.parentId}
        title={page.title}
      />
    );
  }

  if (page.parentId) {
    return (
      <DocPageWithProperties
        key={page.id}
        pageId={page.id}
        parentId={page.parentId}
        initialContent={page.content as Value}
        initialTitle={page.title}
        initialIcon={page.icon}
      />
    );
  }

  return (
    <PageEditor
      key={page.id}
      pageId={page.id}
      initialContent={page.content as Value}
      initialTitle={page.title}
      initialIcon={page.icon}
    />
  );
};

export const Route = createFileRoute("/_authenticated/pages/$pageId")({
  component: PageView,
  ssr: "data-only",
  loader: ({ context: { queryClient }, params: { pageId } }) =>
    queryClient.ensureQueryData(getPageByIdQueryOption(pageId)),
  pendingComponent: Loader,
  errorComponent: ErrorBoundary,
  notFoundComponent: NotFound,
});
