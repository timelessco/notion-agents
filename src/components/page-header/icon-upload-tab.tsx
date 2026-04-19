import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
  ImageCropReset,
} from "@/components/ui/image-crop";
import { ImageIcon } from "@/components/ui/icons";
import { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

import { PASTE_HINT } from "./cover-gallery";

export const IconUploadTab = ({
  currentIcon,
  onUpload,
  onCancel,
}: {
  currentIcon: string | null;
  onUpload: (url: string) => void;
  onCancel: () => void;
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
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
        const file = files[0].file as File;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
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
            setSelectedFile(file);
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
    setSelectedFile(null);
    setShowCrop(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  if (showCrop && selectedFile) {
    return (
      <div className="w-[310px] px-3 flex flex-col">
        <ImageCrop
          file={selectedFile}
          aspect={1}
          onCrop={(croppedImage) => {
            onUpload(croppedImage);
            resetState();
          }}
        >
          <div className="flex items-center justify-center py-3 overflow-hidden">
            <ImageCropContent className="max-h-[250px] max-w-full rounded-lg" />
          </div>
          <div className="flex items-center justify-between pb-3 pt-1">
            <ImageCropReset render={<Button variant="ghost" size="sm" />}>Reset</ImageCropReset>
            <ImageCropApply render={<Button variant="default" size="sm" />}>Save</ImageCropApply>
          </div>
        </ImageCrop>
      </div>
    );
  }

  if (selectedFile && previewUrl) {
    return (
      <div className="w-[310px] px-3 flex flex-col">
        <div className="flex flex-col items-center justify-center py-4">
          <p className="text-xs text-muted-foreground mb-3">Preview</p>
          <div className="rounded-lg border border-border overflow-hidden shadow-sm">
            <img
              src={previewUrl}
              alt="Preview"
              width={180}
              height={180}
              className="max-w-[180px] max-h-[180px] object-contain"
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
          <Button variant="default" size="sm" onClick={() => setShowCrop(true)}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[310px] px-3 flex flex-col">
      <div className="py-4">
        {currentIcon ? (
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
              src={currentIcon}
              alt="Current icon"
              width={80}
              height={80}
              className="max-w-[80px] max-h-[80px] rounded-lg object-contain"
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

const iconTabs = [
  { value: "icon", label: "Icon" },
  { value: "upload", label: "Upload" },
] as const;

export const IconTabBar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const items = iconTabs;
  const activeIndex = items.findIndex((t) => t.value === value);
  const count = items.length;
  const pillLeft = `calc(${(activeIndex / count) * 100}% + 3px)`;
  const pillWidth = `calc(${100 / count}% - ${6 / count}px)`;

  return (
    <div className="relative bg-secondary rounded-[10px] p-[3px] flex-1 flex">
      <div
        className="absolute top-[3px] bottom-[3px] rounded-[8px] bg-white shadow-[0px_0px_1.5px_0px_rgba(0,0,0,0.16),0px_2px_5px_0px_rgba(0,0,0,0.14)] dark:bg-background z-0 transition-[left,width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ left: pillLeft, width: pillWidth }}
      />
      {items.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative z-10 flex-1 h-7 rounded-[8px] text-sm text-center transition-colors",
            value === tab.value ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
