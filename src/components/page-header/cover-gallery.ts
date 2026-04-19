export const COVER_GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1604076850742-4c7221f3101b?w=800&q=80&tint=true",
    label: "Abstract mesh",
  },
  {
    src: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&q=80&tint=true",
    label: "Abstract gradient",
  },
  {
    src: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80&tint=true",
    label: "Abstract geometric",
  },
  {
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80&tint=true",
    label: "Abstract liquid",
  },
  {
    src: "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&q=80&tint=true",
    label: "3D shapes",
  },
  {
    src: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80&tint=true",
    label: "Gradient curves",
  },
  {
    src: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80&tint=true",
    label: "Geometric waves",
  },
  {
    src: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80&tint=true",
    label: "Abstract paint",
  },
] as const;

const IS_MAC =
  typeof navigator !== "undefined" && /mac/i.test(navigator.userAgent);
export const PASTE_HINT = IS_MAC ? "\u2318+V" : "Ctrl+V";
