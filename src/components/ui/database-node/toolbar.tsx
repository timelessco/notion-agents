import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export const DatabaseToolbar = ({
  title,
  onTitleChange,
  query,
  onQueryChange,
  onAddRow,
  rowCount,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  query: string;
  onQueryChange: (v: string) => void;
  onAddRow: () => void;
  rowCount: number;
}) => (
  <div className="flex flex-col gap-2.5 pb-2">
    <input
      value={title}
      onChange={(e) => onTitleChange(e.target.value)}
      placeholder="Untitled"
      className="border-0 bg-transparent p-0 text-2xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
      onMouseDown={(e) => e.stopPropagation()}
    />
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/60 px-2 py-1 text-[12px] font-medium text-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
          Table
          <span className="text-muted-foreground">{rowCount}</span>
        </span>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 rounded-md bg-accent/60 px-2 h-7">
          <Search className="size-3.5 text-muted-foreground" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search"
            className="w-[140px] bg-transparent text-[12px] outline-none placeholder:text-muted-foreground/60"
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddRow}
          className="h-7 gap-1.5 rounded-md bg-accent/60 px-2 text-[12px] hover:bg-accent"
        >
          <Plus className="size-3.5" />
          New
        </Button>
      </div>
    </div>
  </div>
);
