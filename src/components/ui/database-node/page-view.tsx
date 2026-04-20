import { Plate, usePlateEditor } from "platejs/react";
import type { Value } from "platejs";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { CircleUserRoundIcon, ImageIcon, Plus, Trash2Icon } from "lucide-react";

import { PageBodyKit } from "@/components/editor/plugins/page-body-kit";
import { IconPickerContent, IconPickerPreview } from "@/components/icon-picker";
import { COVER_GALLERY } from "@/components/page-header/cover-gallery";
import { CoverUpload } from "@/components/page-header/cover-upload";
import { IconTabBar, IconUploadTab } from "@/components/page-header/icon-upload-tab";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Editor, EditorContainer } from "@/components/ui/editor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, isValidUrl } from "@/lib/utils";

import { CELL_REGISTRY, USER_SELECTABLE_TYPES, renderCellFromRegistry } from "./registry";
import type { ColumnType, DatabaseColumn, DatabaseRow } from "./types";

const DatabasePageBody = ({
  rowId,
  initialContent,
  readOnly,
  onContentChange,
}: {
  rowId: string;
  initialContent: Value;
  readOnly: boolean;
  onContentChange: (rowId: string, value: Value) => void;
}) => {
  const editor = usePlateEditor(
    {
      id: `db-page-${rowId}`,
      plugins: PageBodyKit,
      value: initialContent,
    },
    [rowId],
  );

  return (
    <Plate
      editor={editor}
      readOnly={readOnly}
      onChange={({ value }) => onContentChange(rowId, value)}
    >
      <EditorContainer>
        <Editor variant="none" className="min-h-[320px] px-0 pb-24 text-[15px]" />
      </EditorContainer>
    </Plate>
  );
};

export const DatabasePageView = ({
  row,
  columns,
  allRows,
  readOnly,
  compact,
  onIconChange,
  onCoverChange,
  onTitleChange,
  onContentChange,
  onCellChange,
  onAddColumn,
  toolbar,
}: {
  row: DatabaseRow;
  columns: DatabaseColumn[];
  allRows: DatabaseRow[];
  readOnly: boolean;
  compact?: boolean;
  onIconChange: (rowId: string, icon: string | undefined) => void;
  onCoverChange: (rowId: string, cover: string | undefined) => void;
  onTitleChange: (rowId: string, title: string) => void;
  onContentChange: (rowId: string, value: Value) => void;
  onCellChange: (rowId: string, colId: string, value: unknown) => void;
  onAddColumn: (type: ColumnType) => void;
  toolbar?: React.ReactNode;
}) => {
  const title = row.title ?? "";
  const icon = row.icon ?? null;
  const cover = row.cover ?? null;
  const hasCover = !!cover;
  const hasLogo = !!icon;

  const DEFAULT_PAGE_CONTENT: Value = [{ type: "p", children: [{ text: "" }] }];

  const [iconPopoverOpen, setIconPopoverOpen] = useState(false);
  const [iconTab, setIconTab] = useState("icon");
  const [coverPopoverOpen, setCoverPopoverOpen] = useState(false);
  const [iconColor, setIconColor] = useState<string>("#000000");

  const titleRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTitle = useCallback(() => {
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    autoResizeTitle();
  }, [title, autoResizeTitle]);

  const handleIconChange = useCallback(
    (next: string | null) => onIconChange(row.id, next ?? undefined),
    [onIconChange, row.id],
  );

  const handleCoverChange = useCallback(
    (next: string | null) => onCoverChange(row.id, next ?? undefined),
    [onCoverChange, row.id],
  );

  const handleAddCover = useCallback(
    () => handleCoverChange(COVER_GALLERY[2].src),
    [handleCoverChange],
  );

  const coverHeight = compact ? "h-28" : "h-40 sm:h-48";
  const logoSize = compact ? "72" : "96";

  return (
    <div className="group/page flex h-full flex-col">
      {toolbar}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {hasCover && (
          <div className="relative">
            <div className={cn("relative w-full bg-muted/20", coverHeight)}>
              {cover && !cover.startsWith("#") ? (
                <>
                  {cover.includes("tint=true") && (
                    <div className="absolute inset-0 z-1 bg-primary opacity-50 mix-blend-color pointer-events-none" />
                  )}
                  <img
                    src={cover}
                    alt="Cover"
                    className={cn(
                      "w-full h-full object-cover border-0",
                      cover.includes("tint=true") && "relative z-0 brightness-60 grayscale",
                    )}
                  />
                </>
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: cover?.startsWith("#") ? cover : "#FFE4E1",
                  }}
                />
              )}
            </div>
            {!readOnly && (
              <Popover open={coverPopoverOpen} onOpenChange={setCoverPopoverOpen}>
                <div className="absolute right-4 top-3 z-10 opacity-0 transition-opacity group-hover/page:opacity-100">
                  <ButtonGroup className="bg-background/80 backdrop-blur-sm rounded-lg shadow-lg border border-border">
                    <PopoverTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-foreground/80 hover:text-foreground hover:bg-secondary text-xs border-none rounded-none rounded-l-lg"
                          onMouseDown={(e) => e.preventDefault()}
                        />
                      }
                    >
                      Change
                    </PopoverTrigger>
                    <ButtonGroupSeparator className="bg-border" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-foreground/80 hover:text-foreground hover:bg-secondary text-xs border-none rounded-none rounded-r-lg"
                      onClick={() => handleCoverChange(null)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      Remove
                    </Button>
                  </ButtonGroup>
                </div>
                <PopoverContent align="end" side="bottom" className="w-[310px] p-0" sideOffset={8}>
                  <Tabs defaultValue="gallery" className="w-full">
                    <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                      <TabsList className="w-full">
                        <TabsTrigger value="gallery">Gallery</TabsTrigger>
                        <TabsTrigger value="upload">Upload</TabsTrigger>
                        <TabsIndicator />
                      </TabsList>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          handleCoverChange(null);
                          setCoverPopoverOpen(false);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        aria-label="Remove cover"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                    <TabsContent value="gallery" className="px-3 pb-3 mt-0">
                      <p className="text-xs text-muted-foreground mb-2 mt-1">Abstract</p>
                      <div className="grid grid-cols-3 gap-2">
                        {COVER_GALLERY.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                              handleCoverChange(item.src);
                              setCoverPopoverOpen(false);
                            }}
                            className="h-16 bg-muted rounded-lg relative cursor-pointer hover:ring-2 ring-primary ring-offset-1 ring-offset-background overflow-hidden transition-all hover:scale-[1.02]"
                            aria-label={item.label}
                          >
                            <div className="absolute inset-0 z-1 bg-primary opacity-50 mix-blend-color pointer-events-none" />
                            <img
                              src={item.src}
                              alt={item.label}
                              className="relative z-0 w-full h-full object-cover brightness-60 grayscale"
                            />
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="upload" className="px-3 pb-3 mt-0">
                      <CoverUpload
                        currentCover={cover}
                        onUpload={(url) => {
                          handleCoverChange(url);
                          setCoverPopoverOpen(false);
                        }}
                        onCancel={() => setCoverPopoverOpen(false)}
                      />
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}

        <div className="mx-auto flex w-full max-w-[780px] flex-col px-8 pb-12">
          <Popover open={iconPopoverOpen} onOpenChange={setIconPopoverOpen}>
            {hasLogo && (
              <div className={cn("relative z-10 mb-1", hasCover ? "-mt-[40px]" : "mt-6")}>
                <PopoverTrigger
                  disabled={readOnly}
                  render={
                    <button
                      type="button"
                      className="cursor-pointer transition-colors"
                      aria-label="Change icon"
                    />
                  }
                >
                  {icon && isValidUrl(icon) ? (
                    <img
                      src={icon}
                      alt="Icon"
                      className={cn(
                        "rounded-md object-cover",
                        compact ? "w-[72px] h-[72px]" : "w-[96px] h-[96px]",
                      )}
                    />
                  ) : (
                    <IconPickerPreview
                      icon={icon}
                      iconColor={iconColor}
                      iconSize="40"
                      size={logoSize}
                    />
                  )}
                </PopoverTrigger>
              </div>
            )}

            {!readOnly && (
              <div
                className={cn(
                  "flex gap-1 mb-2 opacity-0 group-hover/page:opacity-100 transition-opacity",
                  !hasCover && !hasLogo && "mt-6",
                  hasCover && !hasLogo && "mt-3",
                  !hasCover && hasLogo && "mt-0",
                )}
              >
                {!hasLogo && (
                  <PopoverTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        prefix={<CircleUserRoundIcon className="size-4" />}
                        onMouseDown={(e) => e.preventDefault()}
                      />
                    }
                  >
                    Add icon
                  </PopoverTrigger>
                )}
                {!hasCover && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddCover}
                    prefix={<ImageIcon className="size-4" />}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    Add cover
                  </Button>
                )}
              </div>
            )}

            <PopoverContent align="start" side="bottom" className="w-[310px] p-0">
              <div className="w-full">
                <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                  <IconTabBar value={iconTab} onChange={setIconTab} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      handleIconChange(null);
                      setIconPopoverOpen(false);
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    aria-label="Remove icon"
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
                {iconTab === "icon" ? (
                  <IconPickerContent
                    iconValue={icon && !isValidUrl(icon) ? icon : null}
                    iconColor={iconColor}
                    onIconChange={(newIcon) => {
                      handleIconChange(newIcon);
                      setIconPopoverOpen(false);
                    }}
                    onColorChange={setIconColor}
                  />
                ) : (
                  <IconUploadTab
                    currentIcon={icon && isValidUrl(icon) ? icon : null}
                    onUpload={(url) => {
                      handleIconChange(url);
                      setIconPopoverOpen(false);
                    }}
                    onCancel={() => setIconPopoverOpen(false)}
                  />
                )}
              </div>
            </PopoverContent>
          </Popover>

          <textarea
            ref={titleRef}
            rows={1}
            aria-label="Page title"
            className="mt-3 w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[34px] font-bold leading-tight tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40"
            placeholder="Untitled"
            value={title}
            disabled={readOnly}
            onChange={(e) => onTitleChange(row.id, e.target.value)}
            onFocus={autoResizeTitle}
            onMouseDown={(e) => e.stopPropagation()}
          />

          <div className="mt-5 grid grid-cols-[180px_1fr] items-center gap-x-3 gap-y-1">
            {columns
              .filter((c) => c.type !== "title")
              .map((col) => {
                const Icon = CELL_REGISTRY[col.type].Icon;
                return (
                  <Fragment key={col.id}>
                    <div className="flex items-center gap-1.5 py-1 text-[13px] text-muted-foreground">
                      <Icon className="size-3.5 shrink-0" />
                      <span className="truncate">{col.name}</span>
                    </div>
                    <div className="min-w-0 rounded-sm px-2 py-1 text-[13px] hover:bg-muted/40">
                      {renderCellFromRegistry(col, row, allRows, columns, (next) =>
                        onCellChange(row.id, col.id, next),
                      )}
                    </div>
                  </Fragment>
                );
              })}
            {!readOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="col-span-2 mt-1 flex w-fit items-center gap-1.5 rounded-sm px-2 py-1 text-[12px] text-muted-foreground hover:bg-accent/60"
                    >
                      <Plus className="size-3.5" />
                      Add a property
                    </button>
                  }
                />
                <DropdownMenuContent align="start" className="w-44 p-1">
                  {USER_SELECTABLE_TYPES.map((t) => {
                    const { Icon, label } = CELL_REGISTRY[t];
                    return (
                      <DropdownMenuItem
                        key={t}
                        onClick={() => onAddColumn(t)}
                        className="gap-2 text-[13px]"
                      >
                        <Icon className="size-3.5 text-muted-foreground" />
                        {label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="mt-4 border-t border-border/60 pt-4">
            <DatabasePageBody
              key={row.id}
              rowId={row.id}
              initialContent={row.content ?? DEFAULT_PAGE_CONTENT}
              readOnly={readOnly}
              onContentChange={onContentChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
