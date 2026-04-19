# Notion-style Database Node — Design

Date: 2026-04-18
Status: Approved for phased implementation

## Goal

Evolve the existing `database-node.tsx` Plate void element from a 5-type single-view table into a full Notion-style database: ~20 property types, multi-view system (Table / Board / Gallery / List / Calendar), per-view filter/sort/group/visibility, and a real page-per-row experience with header, icon, cover, and an "Open as page" full-viewport mode.

## Current state

- `src/components/ui/database-node.tsx` (917 lines) — monolithic `DatabaseElement`, 5 column types (`text | number | select | checkbox | date`), table-only, search-only filtering.
- `src/components/ui/database-page-drawer.tsx` (114 lines) — side drawer with nested Plate editor (lazy-loaded to avoid cycle with `page-body-kit`).
- `src/components/editor/plugins/database-kit.tsx` — Plate plugin wiring.
- `src/components/ui/data-grid*.tsx` — existing sort/filter/visibility primitives used by the submissions page. Reference only; database node will not depend on them directly.

## Roadmap

### Phase 1 — Data model + property type expansion

Expand `ColumnType` and build a cell registry so every subsequent feature (filter, sort, group, page view) reads from one source of truth.

Types (20+): `text`, `email`, `phone`, `url`, `number`, `currency`, `rating`, `linear-scale`, `select`, `multi-select`, `status`, `checkbox`, `date`, `date-range`, `time`, `file`, `relation`, `formula`, `rollup`, `created-time`, `created-by`, `last-edited-time`, `last-edited-by`.

`DatabaseColumn` gains `config?: ColumnConfig` — a discriminated union keyed by `type` (currency code, rating max/style, scale bounds, select options, status groups, relation target, formula expression, rollup aggregation).

`DatabaseRow` gains `icon?`, `cover?`, `createdAt`, `updatedAt`. Computed types (`formula`, `rollup`, `created-*`, `last-edited-*`) are never stored — evaluated at render.

Backing library: `expr-eval` for formulas (simpler than hand-rolled parser, sandboxed).

Relations: same-element only in v1. Cross-database deferred.

### Phase 2 — Page-per-row

Single `DatabasePageView` component (cover + icon + title + property list + nested editor), rendered by two containers:

1. **Drawer** — existing side-sheet, compact cover, `max-w-[720px]`. Includes its own header toolbar with `Open as page`, `⋯` menu (Delete / Duplicate / Copy link), close button.
2. **Full-page overlay** — query-param driven (`?dbPage=<elementId>:<rowId>`), renders same component full-viewport. Browser back closes it. Preserves editor state.

Property list above the editor mimics the Notion layout: `Icon + Label` on the left, editable cell on the right, `+ Add a property` at the bottom. Each row's `PageField` renderer comes from the cell registry (falls back to inline `Cell`).

### Phase 3 — Views system

```ts
type DatabaseView = {
  id: string;
  name: string;
  layout: "table" | "board" | "gallery" | "list" | "calendar";
  hiddenColumnIds: string[];
  filters: FilterNode;           // and/or tree with leaf predicates
  sorts: { colId: string; dir: "asc" | "desc" }[];
  groupBy?: string;
  conditionalColor?: ConditionalColorRule[];
  boardColumnColId?: string;
  calendarDateColId?: string;
  galleryCoverSource?: "cover" | "firstFile" | "none";
};
```

`DatabaseElementData` gains `views: DatabaseView[]` and `activeViewId`. Default is one table view.

**Derivation pipeline** (`useDerivedRows`): `rows → applyFilters → applySort → applyGroup → layout-shape`. All pure, memoized.

**View settings panel** (Image #2 reference): side-sheet with Layout, Property visibility, Filter, Sort, Group, Conditional color, Copy link. Shared across all layouts.

**Layouts:** Table first, then Board, Gallery, List, Calendar (own micro-phase for date math).

**Conditional color:** per-view `{ filter, color }` rules. Row background in Table/List, card border in Board/Gallery.

### Phase 4 — Polish

Column resize + reorder. Row drag (uses existing handle). Keyboard cell nav. Optional slash menu inside title cell. Clipboard TSV. Undo/redo free via Plate history.

## Architecture

### File layout (Phase 1 refactor)

```
src/components/ui/database-node/
  index.tsx                 # DatabaseElement orchestrator (~200 lines)
  types.ts                  # ColumnType, ColumnConfig, DatabaseRow, DatabaseView
  registry.tsx              # CELL_REGISTRY (source of truth)
  hooks.ts                  # usePatchElement, useDerivedRows
  toolbar.tsx               # DatabaseToolbar + view tabs + view-settings trigger
  view-settings-panel.tsx   # Phase 3
  column-header.tsx         # ColumnHeaderMenu + per-type ConfigEditor
  page-view.tsx             # DatabasePageView (shared by drawer + overlay)
  page-drawer.tsx           # container #1 (replaces current database-page-drawer.tsx)
  page-overlay.tsx          # container #2 (query-param driven)
  layouts/
    table.tsx
    board.tsx
    gallery.tsx
    list.tsx
    calendar.tsx
  cells/
    text-cell.tsx           # text | email | phone | url
    number-cell.tsx         # number | currency
    rating-cell.tsx         # rating | linear-scale
    select-cell.tsx         # select | multi-select | status
    date-cell.tsx           # date | date-range | time
    checkbox-cell.tsx
    file-cell.tsx
    relation-cell.tsx
    formula-cell.tsx
    rollup-cell.tsx
    auto-cell.tsx
```

### Cell registry

```ts
type CellRegistryEntry = {
  Icon: ComponentType<{ className?: string }>;
  label: string;
  defaultConfig?: ColumnConfig;
  isComputed?: boolean;
  coerce: (v: unknown, col: DatabaseColumn) => unknown;
  Cell: ComponentType<CellProps>;          // inline table cell
  PageField?: ComponentType<CellProps>;    // drawer/page variant, optional
  ConfigEditor?: ComponentType<ConfigProps>;
  filterOperators?: FilterOperator[];
  sortable?: boolean;
  groupable?: boolean;
};
```

Adding a new type = one registry entry. Filter/sort/group in Phase 3 read capabilities from the registry rather than switching on `type` across the codebase.

### Storage

Row data lives in the Plate element node (current approach). Works up to roughly 500 rows before editor JSON bloat becomes noticeable. If users hit that ceiling, migrate row data to a sibling TanStack DB collection keyed by database id. Not a v1 concern.

## Rollout order

1. Phase 1a — registry infrastructure + file refactor (no new types yet)
2. Phase 1b — add property types in batches (text family → numeric → choice → date → media/ref → auto)
3. Phase 2 — page view + drawer redesign + full-page overlay
4. Phase 3a — view data model + Table view adopts it
5. Phase 3b — Board, Gallery, List (one PR each)
6. Phase 3c — Calendar
7. Phase 4 — polish, opportunistic

## Open questions (tracked, not blocking)

- **Performance** — when does in-node storage become the bottleneck in practice?
- **Cross-database relations** — needs per-editor database registry; deferred.
- **Formula perf** — `expr-eval` is fine per-row, may need dependency-hash caching on large grids.

## Non-goals (v1)

- Timeline/Gantt layout
- Synced databases across pages
- Sub-items / nested rows
- API / webhook integrations
