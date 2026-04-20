import { useState } from "react";
import {
  BarChart3Icon,
  CalendarIcon,
  GalleryThumbnailsIcon,
  KanbanIcon,
  LayoutListIcon,
  Plus,
  Settings2,
  TableIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

import type { DatabaseLayout, DatabaseView } from "./types";

const LAYOUT_ICON: Record<DatabaseLayout, React.ComponentType<{ className?: string }>> = {
  table: TableIcon,
  board: KanbanIcon,
  gallery: GalleryThumbnailsIcon,
  list: LayoutListIcon,
  calendar: CalendarIcon,
  chart: BarChart3Icon,
};

export const ViewTabs = ({
  views,
  activeViewId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  onOpenSettings,
  readOnly,
}: {
  views: DatabaseView[];
  activeViewId: string;
  onSelect: (id: string) => void;
  onAdd: (layout: DatabaseLayout) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onOpenSettings: () => void;
  readOnly: boolean;
}) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  return (
    <div className="flex items-center gap-0.5 border-b border-border/40 pb-0.5">
      {views.map((v) => {
        const Icon = LAYOUT_ICON[v.layout];
        const active = v.id === activeViewId;
        const editing = renamingId === v.id;
        return (
          <div
            key={v.id}
            className={cn(
              "group/tab flex items-center gap-1 border-b-2 px-2 py-1 text-[12px]",
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(v.id)}
              onDoubleClick={() => {
                if (readOnly) return;
                setRenamingId(v.id);
                setRenameDraft(v.name);
              }}
              className="flex items-center gap-1"
            >
              <Icon className="size-3.5" />
              {editing ? (
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={() => {
                    if (renameDraft.trim()) onRename(v.id, renameDraft.trim());
                    setRenamingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.currentTarget as HTMLInputElement).blur();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setRenamingId(null);
                    }
                  }}
                  className="w-20 bg-transparent outline-none"
                  onMouseDown={(e) => e.stopPropagation()}
                />
              ) : (
                <span>{v.name}</span>
              )}
            </button>
            {active && !readOnly && !editing && views.length > 1 && (
              <button
                type="button"
                onClick={() => onDelete(v.id)}
                className="opacity-0 transition-opacity group-hover/tab:opacity-100"
                aria-label="Delete view"
              >
                <XIcon className="size-2.5" />
              </button>
            )}
          </div>
        );
      })}
      {!readOnly && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent"
                aria-label="Add view"
              >
                <Plus className="size-3.5" />
              </button>
            }
          />
          <DropdownMenuContent align="start" className="w-40 p-1">
            {(Object.keys(LAYOUT_ICON) as DatabaseLayout[]).map((l) => {
              const Icon = LAYOUT_ICON[l];
              return (
                <DropdownMenuItem
                  key={l}
                  onClick={() => onAdd(l)}
                  className="gap-2 text-[13px] capitalize"
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  {l}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <div className="ml-auto">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent"
          aria-label="View settings"
        >
          <Settings2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
};
