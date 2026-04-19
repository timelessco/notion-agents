import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { ImageIcon } from "@/components/ui/icons";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

import { PASTE_HINT } from "./cover-gallery";

export const CoverUpload = ({
  currentCover,
  onUpload,
  onCancel,
}: {
  currentCover: string | null;
  onUpload: (url: string) => void;
  onCancel: () => void;
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [
    { isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    accept: "image/*",
    multiple: false,
    onFilesChange: (files) => {
      if (files[0]?.file) {
        setPreviewUrl(URL.createObjectURL(files[0].file as File));
      }
    },
  });

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            setPreviewUrl(URL.createObjectURL(file));
          }
          return;
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const resetState = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  if (previewUrl) {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          <div className="rounded-lg border border-border overflow-hidden shadow-sm">
            <img
              src={previewUrl}
              alt="Preview"
              width={260}
              height={120}
              className="max-w-[260px] max-h-[120px] object-cover"
            />
          </div>
        </div>

        {errors.length > 0 && (
          <p className="text-destructive text-xs pb-2 text-center">{errors[0]}</p>
        )}

        <div className="flex items-center justify-between pb-3 pt-1">
          <Button variant="ghost" size="sm" onClick={resetState}>
            Back
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              onUpload(previewUrl);
              resetState();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="py-4">
        {currentCover && !currentCover.startsWith("#") ? (
          <button
            type="button"
            className="w-full rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 py-4 transition-all cursor-pointer"
            onClick={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input {...getInputProps()} className="sr-only" />
            <img
              src={currentCover}
              alt="Current cover"
              width={200}
              height={80}
              className="max-w-[200px] max-h-[80px] rounded-lg object-cover"
            />
            <span className="text-xs text-muted-foreground">Click to replace</span>
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "w-full h-24 rounded-lg border border-dashed flex items-center justify-center gap-2.5 transition-all cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/50",
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input {...getInputProps()} className="sr-only" />
            <ImageIcon className="h-5 w-5 text-muted-foreground/60" />
            <span className="text-sm text-muted-foreground">Upload an image</span>
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground/60 text-center pb-3">
        or {PASTE_HINT} to paste an image or link
      </p>

      {errors.length > 0 && (
        <p className="text-destructive text-xs pb-2 text-center">{errors[0]}</p>
      )}

      <div className="flex items-center justify-between pb-3 pt-1 border-t border-border">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};
