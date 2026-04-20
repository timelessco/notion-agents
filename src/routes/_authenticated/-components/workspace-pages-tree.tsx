import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ChevronDownIcon,
  FileIcon,
  MoreHorizontalIcon,
  Pencil2Icon,
  PlusIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { DatabaseIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  createPage,
  deletePage,
  listWorkspacePagesQueryOption,
  renamePage,
} from "@/lib/server-fn/pages";

interface PageNode {
  id: string;
  title: string;
  icon: string | null;
  kind: string;
  parentId: string | null;
  children: PageNode[];
}

const buildTree = (
  rows: { id: string; title: string; icon: string | null; kind: string; parentId: string | null }[],
): PageNode[] => {
  const byId = new Map<string, PageNode>();
  for (const row of rows) byId.set(row.id, { ...row, children: [] });
  const roots: PageNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
};

interface Props {
  workspaceId: string;
  activePageId?: string;
}

export const WorkspacePagesTree = ({ workspaceId, activePageId }: Props) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(listWorkspacePagesQueryOption(workspaceId));

  const tree = useMemo(() => buildTree(data?.pages ?? []), [data]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["pages", "list", workspaceId] });

  const createMut = useMutation({
    mutationFn: async (parentId: string | null) => {
      const id = crypto.randomUUID();
      await createPage({ data: { id, workspaceId, parentId } });
      return id;
    },
    onSuccess: async (id) => {
      await invalidate();
      await navigate({ to: "/pages/$pageId", params: { pageId: id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Create failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePage({ data: { id } }),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const renameMut = useMutation({
    mutationFn: (vars: { id: string; title: string }) => renamePage({ data: vars }),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Rename failed"),
  });

  if (isLoading && !data) {
    return <div className="px-2 py-1 text-muted-foreground text-xs">Loading pages…</div>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Pages
        </span>
        <button
          type="button"
          aria-label="New page"
          onClick={() => createMut.mutate(null)}
          className="flex h-5 w-5 items-center justify-center rounded-sm hover:bg-accent"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      {tree.length === 0 ? (
        <div className="px-2 py-1 text-muted-foreground text-xs">No pages yet</div>
      ) : (
        <ul className="flex flex-col">
          {tree.map((node) => (
            <PageTreeItem
              key={node.id}
              node={node}
              depth={0}
              activePageId={activePageId}
              onCreateChild={(parentId) => createMut.mutate(parentId)}
              onDelete={(id) => deleteMut.mutate(id)}
              onRename={(id, title) => renameMut.mutate({ id, title })}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

interface ItemProps {
  node: PageNode;
  depth: number;
  activePageId?: string;
  onCreateChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

const PageTreeItem = ({
  node,
  depth,
  activePageId,
  onCreateChild,
  onDelete,
  onRename,
}: ItemProps) => {
  const hasChildren = node.children.length > 0;
  const isActive = node.id === activePageId;

  return (
    <li>
      <Collapsible defaultOpen>
        <div
          className={cn(
            "group flex items-center gap-1 rounded-sm px-1 py-0.5 text-sm hover:bg-accent/50",
            isActive && "bg-accent",
          )}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          <CollapsibleTrigger
            aria-label="Toggle"
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm",
              !hasChildren && "invisible",
            )}
          >
            <ChevronDownIcon className="h-3 w-3 transition-transform data-[panel-closed]:-rotate-90" />
          </CollapsibleTrigger>
          {node.kind === "database" ? (
            <DatabaseIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <FileIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <Link to="/pages/$pageId" params={{ pageId: node.id }} className="flex-1 truncate">
            {node.title || "Untitled"}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Page actions"
              className="flex h-5 w-5 items-center justify-center rounded-sm opacity-0 hover:bg-accent group-hover:opacity-100"
            >
              <MoreHorizontalIcon className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onCreateChild(node.id)}>
                <PlusIcon className="mr-2 h-3.5 w-3.5" /> New subpage
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  const next = window.prompt("Rename page", node.title)?.trim();
                  if (next && next !== node.title) onRename(node.id, next);
                }}
              >
                <Pencil2Icon className="mr-2 h-3.5 w-3.5" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (window.confirm(`Delete "${node.title}"?`)) onDelete(node.id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <TrashIcon className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {hasChildren && (
          <CollapsibleContent>
            <ul className="flex flex-col">
              {node.children.map((child) => (
                <PageTreeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  activePageId={activePageId}
                  onCreateChild={onCreateChild}
                  onDelete={onDelete}
                  onRename={onRename}
                />
              ))}
            </ul>
          </CollapsibleContent>
        )}
      </Collapsible>
    </li>
  );
};
