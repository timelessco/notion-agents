import { ImageIcon, CircleUserRoundIcon, SettingsIcon, Trash2Icon } from "@/components/ui/icons";
import { IconPickerContent, IconPickerPreview } from "@/components/icon-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlateElementProps } from "platejs/react";
import { PlateElement, useEditorRef } from "platejs/react";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { createFormButtonNode } from "@/components/ui/form-button-node";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEditorTheme } from "@/contexts/editor-theme-context";
import { useEditorSidebar } from "@/hooks/use-editor-sidebar";
import { COVER_GALLERY } from "@/components/page-header/cover-gallery";
import { CoverUpload } from "@/components/page-header/cover-upload";
import { IconTabBar, IconUploadTab } from "@/components/page-header/icon-upload-tab";
import type { FormHeaderElementData } from "@/lib/form-schema/form-header-factory";
import { THEME_COLORS } from "@/lib/theme/theme-presets";
import { DEFAULT_ICON } from "@/lib/config/app-config";
import { cn, isValidUrl } from "@/lib/utils";
export {
  createFormHeaderNode,
  type FormHeaderElementData,
} from "@/lib/form-schema/form-header-factory";

// Static derivations from THEME_COLORS — hoisted to module scope to avoid re-computing on every render
const ACCENT_COLORS = Object.values(THEME_COLORS).map((t) => t.primary);
const PRIMARY_TO_THEME_NAME = new Map(
  Object.entries(THEME_COLORS).map(([name, t]) => [t.primary, name]),
);

export const FormHeaderElement = (props: PlateElementProps) => {
  const { element, children } = props;
  const editor = useEditorRef();
  const {
    hasCustomization,
    themeVars,
    customization: editorCustomization,
    updateThemeColor,
  } = useEditorTheme();
  const { activeSidebar, closeSidebar, openCustomize } = useEditorSidebar();
  const toggleCustomize = useCallback(() => {
    if (activeSidebar === "customize") {
      closeSidebar();
    } else {
      openCustomize();
    }
  }, [activeSidebar, closeSidebar, openCustomize]);

  const title = (element.title as string) || "";
  const icon = (element.icon as string | null) || null;
  const iconColor = (element.iconColor as string | null) || null;
  const cover = (element.cover as string | null) || null;

  const hasCover = !!cover;
  const hasLogo = !!icon;

  const updateHeader = useCallback(
    (updates: Partial<FormHeaderElementData>) => {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes(updates, { at: path });
      }
    },
    [editor, element],
  );

  const titleRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTitle = useCallback(() => {
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);

  const titleFontSize = editorCustomization?.titleFontSize;
  const titleFont = editorCustomization?.titleFont;

  useEffect(() => {
    autoResizeTitle();
  }, [title, titleFontSize, titleFont, autoResizeTitle]);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      updateHeader({ title: newTitle });
    },
    [updateHeader],
  );

  const handleIconChange = useCallback(
    (newIcon: string | null) => {
      updateHeader({ icon: newIcon });
    },
    [updateHeader],
  );

  const handleIconColorChange = useCallback(
    (newColor: string) => {
      updateHeader({ iconColor: newColor });
    },
    [updateHeader],
  );

  const handleCoverChange = useCallback(
    (newCover: string | null) => {
      updateHeader({ cover: newCover });
    },
    [updateHeader],
  );

  const handleAddCover = useCallback(
    () =>
      handleCoverChange(
        "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80&tint=true",
      ),
    [handleCoverChange],
  );

  const accentColors = hasCustomization ? ACCENT_COLORS : undefined;
  const activeThemeColorName = editorCustomization?.themeColor || "zinc";
  const activeAccentColor =
    THEME_COLORS[activeThemeColorName]?.primary || THEME_COLORS.zinc.primary;
  const isLogoMinimal =
    hasCustomization &&
    editorCustomization?.logoWidth &&
    Number.parseInt(editorCustomization.logoWidth) <= 0;

  const logoCircleSize =
    hasCustomization && editorCustomization?.logoWidth
      ? String(Math.max(48, Number.parseInt(editorCustomization.logoWidth)))
      : "100";

  const [iconPopoverOpen, setIconPopoverOpen] = useState(false);
  const [iconTab, setIconTab] = useState("icon");
  const [coverPopoverOpen, setCoverPopoverOpen] = useState(false);

  return (
    <PlateElement {...props} attributes={{ ...props.attributes, "data-bf-header": "" }}>
      <div
        contentEditable={false}
        className="group relative w-full flex flex-col mb-4 select-none rounded-none"
      >
        {hasCover && (
          <>
            <div
              className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] h-[120px] sm:h-[200px] group/cover bg-muted/20"
              data-bf-cover
            >
              {cover && !cover.startsWith("#") ? (
                <>
                  {cover.includes("tint=true") && (
                    <div className="absolute inset-0 z-1 bg-primary opacity-50 mix-blend-color pointer-events-none" />
                  )}
                  <img
                    src={cover}
                    alt="Cover"
                    width={800}
                    height={200}
                    className={cn(
                      "w-full h-full object-cover border-0 ",
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
            <Popover open={coverPopoverOpen} onOpenChange={setCoverPopoverOpen}>
              <div
                className="absolute top-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ right: "calc(var(--editor-px, 64px) * -1 + 16px)" }}
              >
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
                    className="text-foreground/80 hover:text-foreground hover:bg-secondary text-xs border-none rounded-none"
                    onClick={() => handleCoverChange(null)}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    Remove
                  </Button>
                  <ButtonGroupSeparator className="bg-border" />
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
                      <Trash2Icon />
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
                            width={200}
                            height={64}
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
          </>
        )}
        <div className={cn("relative w-full flex flex-col")}>
          <div className="w-full">
            <Popover open={iconPopoverOpen} onOpenChange={setIconPopoverOpen}>
              {hasLogo && (
                <div
                  className={cn("relative z-10 mb-1", hasCover ? "-mt-[50px]" : "mt-4 sm:mt-6")}
                  data-bf-logo-emoji-container={
                    hasCover && icon && !isValidUrl(icon) ? "true" : undefined
                  }
                  data-bf-logo-container={hasCover && icon && isValidUrl(icon) ? "true" : undefined}
                >
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        className="cursor-pointer transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        aria-label="Change icon"
                      />
                    }
                  >
                    {icon && icon !== DEFAULT_ICON ? (
                      isValidUrl(icon) ? (
                        <img
                          src={icon}
                          alt="Logo"
                          width={120}
                          height={120}
                          className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-md object-cover"
                          data-bf-logo
                        />
                      ) : (
                        <span data-bf-logo-icon={isLogoMinimal ? "minimal" : ""}>
                          <IconPickerPreview
                            icon={icon}
                            iconColor={hasCustomization ? undefined : iconColor || undefined}
                            useThemeColor={hasCustomization || !iconColor}
                            iconSize="48"
                            size={logoCircleSize}
                          />
                        </span>
                      )
                    ) : (
                      <span data-bf-logo-icon={isLogoMinimal ? "minimal" : ""}>
                        <IconPickerPreview
                          icon={null}
                          iconColor={undefined}
                          useThemeColor
                          iconSize="48"
                          size={logoCircleSize}
                        />
                      </span>
                    )}
                  </PopoverTrigger>
                </div>
              )}

              <div
                className={cn(
                  "flex gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  !hasCover && !hasLogo && "mt-8 sm:mt-12",
                  hasCover && !hasLogo && "mt-4",
                  !hasCover && hasLogo && "mt-0",
                )}
              >
                {!hasLogo && (
                  <PopoverTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        prefix={<CircleUserRoundIcon />}
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
                    prefix={<ImageIcon />}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    Add cover
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleCustomize}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <SettingsIcon />
                  Customize
                </Button>
              </div>

              <PopoverContent
                align="start"
                side="bottom"
                className={cn(
                  "w-[310px] p-0",
                  hasCustomization && "bf-themed",
                  hasCustomization && editorCustomization?.mode === "dark" && "dark",
                )}
                style={hasCustomization ? themeVars : undefined}
              >
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
                      <Trash2Icon />
                    </Button>
                  </div>
                  {iconTab === "icon" ? (
                    <IconPickerContent
                      iconValue={icon && icon !== DEFAULT_ICON && !isValidUrl(icon) ? icon : null}
                      iconColor={hasCustomization ? activeAccentColor : iconColor || "#000000"}
                      onIconChange={(newIcon) => {
                        handleIconChange(newIcon);
                        setIconPopoverOpen(false);
                      }}
                      onColorChange={(color) => {
                        if (hasCustomization && updateThemeColor) {
                          const themeName = PRIMARY_TO_THEME_NAME.get(color);
                          if (themeName) updateThemeColor(themeName);
                        } else {
                          handleIconColorChange(color);
                        }
                      }}
                      colors={accentColors}
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

            <div className="relative group/title">
              <textarea
                ref={titleRef}
                rows={1}
                aria-label="Form title"
                className="w-full text-[48px] font-['Timeless_Serif'] placeholder:font-['Timeless_Serif'] font-[252] leading-tight tracking-[-1.44px] border-none outline-none bg-transparent text-foreground placeholder:text-foreground/50 py-1 sm:py-2 h-auto select-text resize-none overflow-hidden"
                placeholder="Create your form."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onFocus={autoResizeTitle}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    const firstBlockPath = [1];
                    // eslint-disable-next-line typescript-eslint/no-explicit-any
                    const startPoint = (editor.api as any).edges(firstBlockPath)?.[0];
                    if (startPoint) {
                      editor.tf.select(startPoint);
                      editor.tf.focus();
                    }
                    return;
                  }
                  if (e.key === "Tab" && !e.shiftKey) {
                    e.preventDefault();
                    const firstBlockPath = [1];
                    // eslint-disable-next-line typescript-eslint/no-explicit-any
                    const startPoint = (editor.api as any).edges(firstBlockPath)?.[0];
                    if (startPoint) {
                      editor.tf.select(startPoint);
                      editor.tf.focus();
                    }
                    return;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    // Check if onboarding content is present (by type)
                    const secondBlock = editor.children[1] as { type?: string };
                    const isOnboarding = secondBlock?.type === "onboardingContent";

                    if (isOnboarding) {
                      // Clear to empty state: header + empty paragraph + submit button
                      const currentHeader = editor.children[0];
                      const emptyContent = [
                        currentHeader,
                        { type: "p", children: [{ text: "" }] },
                        createFormButtonNode("submit"),
                      ];
                      editor.tf.init({
                        // eslint-disable-next-line typescript-eslint/no-explicit-any
                        value: emptyContent as any,
                      });
                      // Move cursor to first paragraph
                      const firstBlockPath = [1];
                      // eslint-disable-next-line typescript-eslint/no-explicit-any
                      const startPoint = (editor.api as any).edges(firstBlockPath)?.[0];
                      if (startPoint) {
                        editor.tf.select(startPoint);
                        editor.tf.focus();
                      }
                    } else {
                      // Normal behavior: move focus to first block
                      const firstBlockPath = [1];
                      // eslint-disable-next-line typescript-eslint/no-explicit-any
                      const startPoint = (editor.api as any).edges(firstBlockPath)?.[0];
                      if (startPoint) {
                        editor.tf.select(startPoint);
                        editor.tf.focus();
                      }
                    }
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      </div>
      {children}
    </PlateElement>
  );
};
