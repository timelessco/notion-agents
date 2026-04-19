import type { PlateElementProps } from "platejs/react";
import { PlateElement, useEditorRef, useReadOnly } from "platejs/react";
import type { Value } from "platejs";
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { MULTI_SELECT_COLORS } from "@/components/ui/form-option-item-node";
import { cn } from "@/lib/utils";

import { applyFilter, applyGroup, applySort, conditionalColorFor } from "./filters";
import { BoardLayout } from "./layouts/board";
import { CalendarLayout } from "./layouts/calendar";
import { GalleryLayout } from "./layouts/gallery";
import { ListLayout } from "./layouts/list";
import { TableLayout } from "./layouts/table";
import { CELL_REGISTRY, renderCellFromRegistry } from "./registry";
import { DatabaseToolbar } from "./toolbar";
import type {
  ColumnType,
  DatabaseColumn,
  DatabaseElementData,
  DatabaseLayout,
  DatabaseRow,
  DatabaseView,
} from "./types";
import { EMPTY_FILTER, uid } from "./types";
import { ViewSettingsPanel } from "./view-settings-panel";
import { ViewTabs } from "./view-tabs";

const DatabasePageDrawerLazy = lazy(() => import("./page-drawer"));
const DatabasePageOverlayLazy = lazy(() => import("./page-overlay"));

export type {
  ColumnType,
  DatabaseColumn,
  DatabaseElementData,
  DatabaseRow,
  DatabaseView,
  SelectOption,
} from "./types";
export { CELL_REGISTRY, TYPE_META } from "./registry";

const defaultView = (layout: DatabaseLayout = "table"): DatabaseView => ({
  id: uid(),
  name: `${layout.charAt(0).toUpperCase()}${layout.slice(1)} view`,
  layout,
  hiddenColumnIds: [],
  filter: EMPTY_FILTER,
  sorts: [],
});

export const createDatabaseNode = (
  overrides: Partial<Omit<DatabaseElementData, "type" | "children">> = {},
): DatabaseElementData => {
  const nameColId = uid();
  const tagsColId = uid();
  const doneColId = uid();
  const now = Date.now();
  const firstView = defaultView("table");
  return {
    type: "database",
    id: overrides.id ?? uid(),
    title: overrides.title ?? "",
    columns: overrides.columns ?? [
      { id: nameColId, name: "Name", type: "text", width: 240 },
      {
        id: tagsColId,
        name: "Tags",
        type: "select",
        width: 160,
        options: [
          { id: uid(), label: "Idea", colorIdx: 2 },
          { id: uid(), label: "In progress", colorIdx: 4 },
          { id: uid(), label: "Done", colorIdx: 3 },
        ],
      },
      { id: doneColId, name: "Done", type: "checkbox", width: 80 },
    ],
    rows:
      overrides.rows ??
      [1, 2, 3].map(() => ({
        id: uid(),
        cells: {},
        createdAt: now,
        updatedAt: now,
      })),
    views: overrides.views ?? [firstView],
    activeViewId: overrides.activeViewId ?? firstView.id,
    children: [{ text: "" }],
  };
};

export const DatabaseElement = (props: PlateElementProps) => {
  const { element, children } = props;
  const editor = useEditorRef();
  const readOnly = useReadOnly();

  const title = (element.title as string) ?? "";
  const columns = (element.columns as DatabaseColumn[]) ?? [];
  const rows = (element.rows as DatabaseRow[]) ?? [];
  const storedViews = element.views as DatabaseView[] | undefined;
  const views: DatabaseView[] = useMemo(
    () => (storedViews && storedViews.length > 0 ? storedViews : [defaultView("table")]),
    [storedViews],
  );
  const storedActiveId = element.activeViewId as string | undefined;
  const activeViewId = storedActiveId && views.some((v) => v.id === storedActiveId)
    ? storedActiveId
    : views[0].id;
  const activeView = views.find((v) => v.id === activeViewId) ?? views[0];

  const [query, setQuery] = useState("");
  const [openColumnMenu, setOpenColumnMenu] = useState<string | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const patch = useCallback(
    (data: Partial<DatabaseElementData>) => {
      const path = editor.api.findPath(element);
      if (path) editor.tf.setNodes(data, { at: path });
    },
    [editor, element],
  );

  const existingId = element.id as string | undefined;
  useEffect(() => {
    if (!existingId && !readOnly) {
      patch({ id: uid() });
    }
  }, [existingId, readOnly, patch]);
  const databaseId = existingId ?? "";

  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { dbRow?: string };
  const searchDbRow = search.dbRow;
  const pageRowId = useMemo(() => {
    if (!searchDbRow || !databaseId) return null;
    const [bid, rid] = searchDbRow.split(":");
    return bid === databaseId ? rid ?? null : null;
  }, [searchDbRow, databaseId]);

  const openAsPage = useCallback(
    (rowId: string) => {
      if (!databaseId) return;
      void navigate({
        to: ".",
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          dbRow: `${databaseId}:${rowId}`,
        }),
        replace: false,
      });
    },
    [databaseId, navigate],
  );

  const closePage = useCallback(() => {
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => {
        const { dbRow: _omit, ...rest } = prev;
        return rest;
      },
      replace: false,
    });
  }, [navigate]);

  const setColumns = useCallback(
    (updater: (prev: DatabaseColumn[]) => DatabaseColumn[]) => {
      patch({ columns: updater(columns) });
    },
    [columns, patch],
  );

  const setRows = useCallback(
    (updater: (prev: DatabaseRow[]) => DatabaseRow[]) => {
      patch({ rows: updater(rows) });
    },
    [rows, patch],
  );

  const setViews = useCallback(
    (updater: (prev: DatabaseView[]) => DatabaseView[]) => {
      patch({ views: updater(views) });
    },
    [views, patch],
  );

  const setTitle = useCallback((v: string) => patch({ title: v }), [patch]);

  const updateActiveView = useCallback(
    (patchView: Partial<DatabaseView>) => {
      setViews((prev) =>
        prev.map((v) => (v.id === activeView.id ? { ...v, ...patchView } : v)),
      );
    },
    [activeView.id, setViews],
  );

  const touchRow = (row: DatabaseRow): DatabaseRow => ({
    ...row,
    updatedAt: Date.now(),
  });

  const addRow = useCallback(
    (seed?: { colId: string; value: unknown } | string) => {
      const now = Date.now();
      const seedObj = typeof seed === "string" ? undefined : seed;
      const initialCells = seedObj ? { [seedObj.colId]: seedObj.value } : {};
      setRows((prev) => [
        ...prev,
        { id: uid(), cells: initialCells, createdAt: now, updatedAt: now },
      ]);
    },
    [setRows],
  );

  const deleteRow = useCallback(
    (id: string) => {
      setRows((prev) => prev.filter((r) => r.id !== id));
    },
    [setRows],
  );

  const updateCell = useCallback(
    (rowId: string, colId: string, value: unknown) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId ? touchRow({ ...r, cells: { ...r.cells, [colId]: value } }) : r,
        ),
      );
    },
    [setRows],
  );

  const updateRowTitle = useCallback(
    (rowId: string, titleValue: string) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? touchRow({ ...r, title: titleValue }) : r)),
      );
    },
    [setRows],
  );

  const updateRowContent = useCallback(
    (rowId: string, content: Value) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? touchRow({ ...r, content }) : r)),
      );
    },
    [setRows],
  );

  const updateRowIcon = useCallback(
    (rowId: string, icon: string | undefined) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? touchRow({ ...r, icon }) : r)),
      );
    },
    [setRows],
  );

  const updateRowCover = useCallback(
    (rowId: string, cover: string | undefined) => {
      setRows((prev) =>
        prev.map((r) => (r.id === rowId ? touchRow({ ...r, cover }) : r)),
      );
    },
    [setRows],
  );

  const openRow = useMemo(() => rows.find((r) => r.id === openRowId) ?? null, [rows, openRowId]);

  const addColumn = useCallback(
    (type: ColumnType) => {
      setColumns((prev) => {
        const next: DatabaseColumn = {
          id: uid(),
          name: `${CELL_REGISTRY[type].label} ${prev.length + 1}`,
          type,
          width: 160,
        };
        if (type === "select" || type === "multi-select" || type === "status") {
          next.options = [];
        }
        if (type === "currency") {
          next.config = { kind: "currency", code: "USD" };
        } else if (type === "rating") {
          next.config = { kind: "rating", max: 5, style: "star" };
        } else if (type === "linear-scale") {
          next.config = { kind: "linear-scale", min: 1, max: 10, step: 1 };
        } else if (type === "formula") {
          next.config = { kind: "formula", expression: "" };
        } else if (type === "status") {
          next.config = {
            kind: "status",
            groups: [
              { id: uid(), name: "todo", label: "To-do", options: [] },
              { id: uid(), name: "in-progress", label: "In progress", options: [] },
              { id: uid(), name: "complete", label: "Complete", options: [] },
            ],
          };
        }
        return [...prev, next];
      });
    },
    [setColumns],
  );

  const renameColumn = useCallback(
    (id: string, name: string) => {
      setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    },
    [setColumns],
  );

  const changeColumnType = useCallback(
    (id: string, type: ColumnType) => {
      setColumns((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const next: DatabaseColumn = { ...c, type };
          const hadOptions =
            c.type === "select" || c.type === "multi-select" || c.type === "status";
          const needsOptions =
            type === "select" || type === "multi-select" || type === "status";
          if (needsOptions && !hadOptions) next.options = [];
          if (!needsOptions && hadOptions) next.options = undefined;
          if (type === "currency" && next.config?.kind !== "currency")
            next.config = { kind: "currency", code: "USD" };
          else if (type === "rating" && next.config?.kind !== "rating")
            next.config = { kind: "rating", max: 5, style: "star" };
          else if (type === "linear-scale" && next.config?.kind !== "linear-scale")
            next.config = { kind: "linear-scale", min: 1, max: 10, step: 1 };
          else if (type === "formula" && next.config?.kind !== "formula")
            next.config = { kind: "formula", expression: "" };
          else if (type === "status" && next.config?.kind !== "status")
            next.config = {
              kind: "status",
              groups: [
                { id: uid(), name: "todo", label: "To-do", options: [] },
                { id: uid(), name: "in-progress", label: "In progress", options: [] },
                { id: uid(), name: "complete", label: "Complete", options: [] },
              ],
            };
          return next;
        }),
      );
      const col = columns.find((c) => c.id === id);
      setRows((prev) =>
        prev.map((r) => {
          if (!col) return r;
          const coerced = CELL_REGISTRY[type].coerce(r.cells[id], { ...col, type });
          return { ...r, cells: { ...r.cells, [id]: coerced } };
        }),
      );
    },
    [columns, setColumns, setRows],
  );

  const deleteColumn = useCallback(
    (id: string) => {
      setColumns((prev) => prev.filter((c) => c.id !== id));
      setRows((prev) =>
        prev.map((r) => {
          const { [id]: _omit, ...rest } = r.cells;
          return { ...r, cells: rest };
        }),
      );
      setViews((prev) =>
        prev.map((v) => ({
          ...v,
          hiddenColumnIds: v.hiddenColumnIds.filter((x) => x !== id),
          sorts: v.sorts.filter((s) => s.colId !== id),
          groupBy: v.groupBy === id ? undefined : v.groupBy,
          boardColumnColId: v.boardColumnColId === id ? undefined : v.boardColumnColId,
          calendarDateColId: v.calendarDateColId === id ? undefined : v.calendarDateColId,
        })),
      );
    },
    [setColumns, setRows, setViews],
  );

  const addSelectOption = useCallback(
    (colId: string, label: string) => {
      setColumns((prev) =>
        prev.map((c) => {
          if (c.id !== colId) return c;
          const existing = c.options ?? [];
          return {
            ...c,
            options: [
              ...existing,
              { id: uid(), label, colorIdx: existing.length % MULTI_SELECT_COLORS.length },
            ],
          };
        }),
      );
    },
    [setColumns],
  );

  const renameSelectOption = useCallback(
    (colId: string, optionId: string, label: string) => {
      setColumns((prev) =>
        prev.map((c) =>
          c.id !== colId
            ? c
            : {
                ...c,
                options: (c.options ?? []).map((o) =>
                  o.id === optionId ? { ...o, label } : o,
                ),
              },
        ),
      );
    },
    [setColumns],
  );

  const deleteSelectOption = useCallback(
    (colId: string, optionId: string) => {
      setColumns((prev) =>
        prev.map((c) =>
          c.id !== colId
            ? c
            : { ...c, options: (c.options ?? []).filter((o) => o.id !== optionId) },
        ),
      );
      setRows((prev) =>
        prev.map((r) => {
          const v = r.cells[colId];
          if (v === optionId) return { ...r, cells: { ...r.cells, [colId]: "" } };
          if (Array.isArray(v) && v.includes(optionId)) {
            return { ...r, cells: { ...r.cells, [colId]: v.filter((x) => x !== optionId) } };
          }
          return r;
        }),
      );
    },
    [setColumns, setRows],
  );

  const visibleColumns = useMemo(
    () => columns.filter((c) => !activeView.hiddenColumnIds.includes(c.id)),
    [columns, activeView.hiddenColumnIds],
  );

  const searchFilteredRows = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => {
      if ((r.title ?? "").toLowerCase().includes(q)) return true;
      return columns.some((c) => {
        const raw = r.cells[c.id];
        if (raw == null || raw === "") return false;
        if (c.type === "select" || c.type === "status") {
          const opt = (c.options ?? []).find((o) => o.id === raw);
          return !!opt && opt.label.toLowerCase().includes(q);
        }
        if (c.type === "multi-select" && Array.isArray(raw)) {
          return (c.options ?? []).some(
            (o) => raw.includes(o.id) && o.label.toLowerCase().includes(q),
          );
        }
        return String(raw).toLowerCase().includes(q);
      });
    });
  }, [rows, columns, query]);

  const derivedRows = useMemo(() => {
    const filtered = applyFilter(searchFilteredRows, activeView.filter, columns);
    return applySort(filtered, activeView.sorts, columns);
  }, [searchFilteredRows, activeView.filter, activeView.sorts, columns]);

  const groups = useMemo(
    () => applyGroup(derivedRows, activeView.groupBy, columns),
    [derivedRows, activeView.groupBy, columns],
  );

  const conditionalColorResolver = useCallback(
    (row: DatabaseRow) =>
      conditionalColorFor(row, columns, activeView.conditionalColor),
    [columns, activeView.conditionalColor],
  );

  const renderCell = useCallback(
    (row: DatabaseRow, col: DatabaseColumn) =>
      renderCellFromRegistry(col, row, rows, columns, (next) =>
        updateCell(row.id, col.id, next),
      ),
    [rows, columns, updateCell],
  );

  const handleAddView = useCallback(
    (layout: DatabaseLayout) => {
      const view = defaultView(layout);
      setViews((prev) => [...prev, view]);
      patch({ activeViewId: view.id });
    },
    [setViews, patch],
  );

  const handleSelectView = useCallback(
    (id: string) => patch({ activeViewId: id }),
    [patch],
  );

  const handleRenameView = useCallback(
    (id: string, name: string) => {
      setViews((prev) => prev.map((v) => (v.id === id ? { ...v, name } : v)));
    },
    [setViews],
  );

  const handleDeleteView = useCallback(
    (id: string) => {
      if (views.length <= 1) return;
      const next = views.filter((v) => v.id !== id);
      setViews(() => next);
      if (activeViewId === id) patch({ activeViewId: next[0].id });
    },
    [views, activeViewId, setViews, patch],
  );

  const activeLayout = activeView.layout;

  const renderLayout = () => {
    switch (activeLayout) {
      case "board":
        return (
          <BoardLayout
            view={activeView}
            columns={columns}
            visibleColumns={visibleColumns}
            rows={derivedRows}
            readOnly={readOnly}
            conditionalColor={conditionalColorResolver}
            onOpenRow={setOpenRowId}
            onAddRow={(seed) => addRow(seed)}
            onCellChange={updateCell}
            renderCell={renderCell}
          />
        );
      case "gallery":
        return (
          <GalleryLayout
            view={activeView}
            columns={columns}
            visibleColumns={visibleColumns}
            rows={derivedRows}
            conditionalColor={conditionalColorResolver}
            onOpenRow={setOpenRowId}
            renderCell={renderCell}
          />
        );
      case "list":
        return (
          <ListLayout
            visibleColumns={visibleColumns}
            rows={derivedRows}
            conditionalColor={conditionalColorResolver}
            onOpenRow={setOpenRowId}
            renderCell={renderCell}
          />
        );
      case "calendar":
        return (
          <CalendarLayout
            view={activeView}
            columns={columns}
            rows={derivedRows}
            onOpenRow={setOpenRowId}
          />
        );
      case "table":
      default:
        return (
          <TableLayout
            visibleColumns={visibleColumns}
            groups={groups}
            readOnly={readOnly}
            emptyLabel={
              query
                ? "No matching rows."
                : derivedRows.length === 0 && rows.length > 0
                  ? "No rows match this view's filters."
                  : "No rows yet. Click New to add one."
            }
            conditionalColor={conditionalColorResolver}
            renderCell={renderCell}
            onAddRow={() => addRow()}
            onDeleteRow={deleteRow}
            onOpenRow={setOpenRowId}
            onAddColumn={addColumn}
            onRenameColumn={renameColumn}
            onChangeColumnType={changeColumnType}
            onDeleteColumn={deleteColumn}
            onAddSelectOption={addSelectOption}
            onRenameSelectOption={renameSelectOption}
            onDeleteSelectOption={deleteSelectOption}
            openColumnMenu={openColumnMenu}
            setOpenColumnMenu={setOpenColumnMenu}
            onResizeColumn={(id, width) =>
              setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, width } : c)))
            }
          />
        );
    }
  };

  return (
    <PlateElement
      {...props}
      className={cn("group/db my-4 select-none", props.className)}
      attributes={{ ...props.attributes, "data-plate-open-context-menu": true }}
    >
      <div
        contentEditable={false}
        className="space-y-2"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <DatabaseToolbar
          title={title}
          onTitleChange={setTitle}
          query={query}
          onQueryChange={setQuery}
          onAddRow={() => addRow()}
          rowCount={rows.length}
        />

        <ViewTabs
          views={views}
          activeViewId={activeView.id}
          onSelect={handleSelectView}
          onAdd={handleAddView}
          onRename={handleRenameView}
          onDelete={handleDeleteView}
          onOpenSettings={() => setSettingsOpen(true)}
          readOnly={readOnly}
        />

        {renderLayout()}

        {rows.length > 0 && (
          <div className="pt-1 text-right text-[11px] text-muted-foreground">
            Count <span className="tabular-nums">{derivedRows.length}</span>
            {derivedRows.length !== rows.length && (
              <span className="text-muted-foreground/60"> / {rows.length}</span>
            )}
          </div>
        )}
      </div>

      {openRowId !== null && pageRowId === null && (
        <Suspense fallback={null}>
          <DatabasePageDrawerLazy
            open={openRowId !== null}
            onClose={() => setOpenRowId(null)}
            onMaximize={() => {
              const rid = openRowId;
              setOpenRowId(null);
              if (rid) openAsPage(rid);
            }}
            row={openRow}
            columns={columns}
            allRows={rows}
            readOnly={readOnly}
            onIconChange={updateRowIcon}
            onCoverChange={updateRowCover}
            onTitleChange={updateRowTitle}
            onContentChange={updateRowContent}
            onCellChange={updateCell}
            onAddColumn={addColumn}
            onDeleteRow={deleteRow}
          />
        </Suspense>
      )}

      {pageRowId !== null && (
        <Suspense fallback={null}>
          <DatabasePageOverlayLazy
            onClose={closePage}
            row={rows.find((r) => r.id === pageRowId) ?? null}
            columns={columns}
            allRows={rows}
            readOnly={readOnly}
            onIconChange={updateRowIcon}
            onCoverChange={updateRowCover}
            onTitleChange={updateRowTitle}
            onContentChange={updateRowContent}
            onCellChange={updateCell}
            onAddColumn={addColumn}
            onDeleteRow={deleteRow}
          />
        </Suspense>
      )}

      <ViewSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        view={activeView}
        columns={columns}
        onUpdateView={updateActiveView}
      />

      {children}
    </PlateElement>
  );
};
