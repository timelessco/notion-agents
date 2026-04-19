import { useState } from "react";
import { PaperclipIcon, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

import type { FileValue } from "../types";
import { uid } from "../types";

const asFiles = (v: unknown): FileValue[] =>
  Array.isArray(v)
    ? v.filter(
        (f): f is FileValue =>
          !!f &&
          typeof f === "object" &&
          typeof (f as FileValue).url === "string" &&
          typeof (f as FileValue).name === "string",
      )
    : [];

export const FileCell = ({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) => {
  const files = asFiles(value);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const add = () => {
    if (!url.trim()) return;
    const n = name.trim() || url.trim().split("/").pop() || "File";
    onChange([...files, { id: uid(), name: n, url: url.trim() }]);
    setName("");
    setUrl("");
    setOpen(false);
  };

  const remove = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-1"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {files.length === 0 && <span className="text-[13px] text-muted-foreground/40">Empty</span>}
      {files.map((f) => (
        <span
          key={f.id}
          className="inline-flex items-center gap-1 rounded-sm bg-accent/60 px-1.5 py-0.5 text-[12px]"
        >
          <PaperclipIcon className="size-3 text-muted-foreground" />
          <a
            href={f.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="max-w-[140px] truncate hover:underline"
          >
            {f.name}
          </a>
          <button
            type="button"
            onClick={() => remove(f.id)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${f.name}`}
          >
            <XIcon className="size-2.5" />
          </button>
        </span>
      ))}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex size-5 items-center justify-center rounded hover:bg-accent"
              aria-label="Add file"
            >
              <Plus className="size-3 text-muted-foreground" />
            </button>
          }
        />
        <DropdownMenuContent align="start" className="w-64 p-2">
          <div className="space-y-1.5">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste file URL..."
              className={cn(
                "w-full rounded-sm border border-border bg-background px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-ring/40",
              )}
              autoFocus
            />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name (optional)"
              className="w-full rounded-sm border border-border bg-background px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button
              type="button"
              onClick={add}
              className="w-full rounded-sm bg-primary px-2 py-1 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add
            </button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
