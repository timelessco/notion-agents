import { useEffect, useRef, useState } from "react";
import { ExternalLinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type TextMode = "text" | "email" | "phone" | "url";

export const TextCell = ({
  value,
  onChange,
  numeric,
  mode = "text",
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  numeric?: boolean;
  mode?: TextMode;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value == null ? "" : String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!editing) setDraft(value == null ? "" : String(value));
  }, [value, editing]);
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const inputType =
    mode === "email" ? "email" : mode === "phone" ? "tel" : mode === "url" ? "url" : numeric ? "number" : "text";

  if (!editing) {
    const label = draft || (numeric ? "0" : "Empty");
    const linkable = !numeric && draft && (mode === "email" || mode === "phone" || mode === "url");
    const href =
      mode === "email" ? `mailto:${draft}` : mode === "phone" ? `tel:${draft}` : draft;
    return (
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={cn(
            "block min-w-0 flex-1 truncate text-left text-[13px] outline-none",
            numeric && "text-right tabular-nums",
            !draft && "text-muted-foreground/40",
            linkable && "text-primary underline-offset-2 hover:underline",
          )}
        >
          {label}
        </button>
        {linkable && (
          <a
            href={href}
            target={mode === "url" ? "_blank" : undefined}
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="shrink-0 text-muted-foreground/60 hover:text-foreground"
            aria-label={`Open ${mode}`}
          >
            <ExternalLinkIcon className="size-3" />
          </a>
        )}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type={inputType}
      value={draft}
      inputMode={
        numeric
          ? "decimal"
          : mode === "email"
            ? "email"
            : mode === "phone"
              ? "tel"
              : mode === "url"
                ? "url"
                : "text"
      }
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        setEditing(false);
        onChange(numeric ? (draft === "" ? "" : Number(draft)) : draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setDraft(value == null ? "" : String(value));
          setEditing(false);
        }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      className={cn(
        "-m-1 w-[calc(100%+0.5rem)] rounded-sm border-0 bg-background px-1 py-0.5 text-[13px] outline-none ring-2 ring-ring/50",
        numeric && "text-right tabular-nums",
      )}
    />
  );
};
