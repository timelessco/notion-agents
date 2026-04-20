import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, exists } from "drizzle-orm";
import { z } from "zod";
import { member, pages, workspaces } from "@/db/schema";
import { db } from "@/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { authWorkspace, getActiveOrgId } from "./auth-helpers";

const serializePage = (page: typeof pages.$inferSelect) => ({
  ...page,
  createdAt: page.createdAt.toISOString(),
  updatedAt: page.updatedAt.toISOString(),
  deletedAt: page.deletedAt?.toISOString() ?? null,
  content: page.content as object[],
  meta: page.meta ?? null,
});

export const createPage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      workspaceId: z.string().uuid(),
      parentId: z.string().uuid().nullish(),
      kind: z.enum(["doc", "database"]).optional(),
      title: z.string().optional(),
      icon: z.string().nullable().optional(),
      cover: z.string().nullable().optional(),
      content: z.array(z.unknown()).optional(),
      meta: z.record(z.string(), z.unknown()).nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const orgId = getActiveOrgId(context.session);
    await authWorkspace(data.workspaceId, context.session.user.id, orgId);

    const [page] = await db
      .insert(pages)
      .values({
        id: data.id,
        workspaceId: data.workspaceId,
        parentId: data.parentId ?? null,
        createdByUserId: context.session.user.id,
        kind: data.kind ?? "doc",
        title: data.title ?? "Untitled",
        icon: data.icon ?? null,
        cover: data.cover ?? null,
        content: data.content ?? [],
        meta: data.meta ?? null,
      })
      .returning();

    return serializePage(page);
  });

const _getPageById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const orgId = getActiveOrgId(context.session);
    const userId = context.session.user.id;

    const memberSubquery = db
      .select({ id: member.id })
      .from(member)
      .where(and(eq(member.userId, userId), eq(member.organizationId, orgId)));

    const [row] = await db
      .select()
      .from(pages)
      .innerJoin(workspaces, eq(pages.workspaceId, workspaces.id))
      .where(
        and(eq(pages.id, data.id), eq(workspaces.organizationId, orgId), exists(memberSubquery)),
      )
      .limit(1);

    if (!row) throw new Error("Page not found");
    return { page: serializePage(row.pages) };
  });

export const getPageByIdQueryOption = (pageId: string) =>
  queryOptions({
    queryKey: ["pages", pageId],
    queryFn: ({ signal }) => _getPageById({ data: { id: pageId }, signal }),
    staleTime: 1000 * 60 * 10,
  });

const _listWorkspacePages = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ workspaceId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const orgId = getActiveOrgId(context.session);
    await authWorkspace(data.workspaceId, context.session.user.id, orgId);

    const rows = await db
      .select({
        id: pages.id,
        title: pages.title,
        icon: pages.icon,
        kind: pages.kind,
        parentId: pages.parentId,
        updatedAt: pages.updatedAt,
      })
      .from(pages)
      .where(eq(pages.workspaceId, data.workspaceId));

    return {
      pages: rows.map((p) => ({
        id: p.id,
        title: p.title,
        icon: p.icon,
        kind: p.kind,
        parentId: p.parentId,
        updatedAt: p.updatedAt.toISOString(),
      })),
    };
  });

export const listWorkspacePagesQueryOption = (workspaceId: string) =>
  queryOptions({
    queryKey: ["pages", "list", workspaceId],
    queryFn: ({ signal }) => _listWorkspacePages({ data: { workspaceId }, signal }),
    staleTime: 1000 * 60,
  });

const _listDatabaseRows = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ dbPageId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const orgId = getActiveOrgId(context.session);
    const userId = context.session.user.id;

    const memberSubquery = db
      .select({ id: member.id })
      .from(member)
      .where(and(eq(member.userId, userId), eq(member.organizationId, orgId)));

    const rows = await db
      .select()
      .from(pages)
      .innerJoin(workspaces, eq(pages.workspaceId, workspaces.id))
      .where(
        and(
          eq(pages.parentId, data.dbPageId),
          eq(pages.kind, "doc"),
          eq(workspaces.organizationId, orgId),
          exists(memberSubquery),
        ),
      );

    return { rows: rows.map((r) => serializePage(r.pages)) };
  });

export type DatabaseRowRecord = ReturnType<typeof serializePage>;

export const listDatabaseRowsQueryOption = (dbPageId: string) =>
  queryOptions({
    queryKey: ["pages", "database-rows", dbPageId],
    queryFn: ({ signal }) => _listDatabaseRows({ data: { dbPageId }, signal }),
    staleTime: 1000 * 60,
  });

const _listDatabasesForWorkspace = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      workspaceId: z.string().uuid(),
      parentPageId: z.string().uuid().nullish(),
    }),
  )
  .handler(async ({ data, context }) => {
    const orgId = getActiveOrgId(context.session);
    await authWorkspace(data.workspaceId, context.session.user.id, orgId);

    const rows = await db
      .select({
        id: pages.id,
        title: pages.title,
        icon: pages.icon,
        parentId: pages.parentId,
      })
      .from(pages)
      .where(and(eq(pages.workspaceId, data.workspaceId), eq(pages.kind, "database")));

    const parentId = data.parentPageId ?? null;
    return {
      databases: rows
        .map((r) => ({
          id: r.id,
          title: r.title,
          icon: r.icon,
          isSibling: parentId != null && r.parentId === parentId,
        }))
        .toSorted((a, b) => {
          if (a.isSibling !== b.isSibling) return a.isSibling ? -1 : 1;
          return a.title.localeCompare(b.title);
        }),
    };
  });

export const listDatabasesForWorkspaceQueryOption = (
  workspaceId: string,
  parentPageId: string | null,
) =>
  queryOptions({
    queryKey: ["pages", "databases", workspaceId, parentPageId ?? "__none__"],
    queryFn: ({ signal }) =>
      _listDatabasesForWorkspace({ data: { workspaceId, parentPageId }, signal }),
    staleTime: 1000 * 60,
  });

export const updatePage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      title: z.string().max(200).optional(),
      icon: z.string().nullable().optional(),
      cover: z.string().nullable().optional(),
      content: z.array(z.unknown()).optional(),
      meta: z.record(z.string(), z.unknown()).nullable().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const orgId = getActiveOrgId(context.session);
    const userId = context.session.user.id;

    const [row] = await db
      .select({ workspaceId: pages.workspaceId })
      .from(pages)
      .innerJoin(workspaces, eq(pages.workspaceId, workspaces.id))
      .where(and(eq(pages.id, data.id), eq(workspaces.organizationId, orgId)))
      .limit(1);
    if (!row) throw new Error("Page not found");
    await authWorkspace(row.workspaceId, userId, orgId);

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.icon !== undefined) patch.icon = data.icon;
    if (data.cover !== undefined) patch.cover = data.cover;
    if (data.content !== undefined) patch.content = data.content;
    if (data.meta !== undefined) patch.meta = data.meta;

    await db.update(pages).set(patch).where(eq(pages.id, data.id));
    return { ok: true as const };
  });

export const deletePage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const orgId = getActiveOrgId(context.session);
    const userId = context.session.user.id;

    const [row] = await db
      .select({ workspaceId: pages.workspaceId })
      .from(pages)
      .innerJoin(workspaces, eq(pages.workspaceId, workspaces.id))
      .where(and(eq(pages.id, data.id), eq(workspaces.organizationId, orgId)))
      .limit(1);
    if (!row) throw new Error("Page not found");
    await authWorkspace(row.workspaceId, userId, orgId);

    await db.delete(pages).where(eq(pages.id, data.id));
    return { ok: true as const };
  });

export const renamePage = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string().uuid(), title: z.string().min(1).max(200) }))
  .handler(async ({ data, context }) => {
    const orgId = getActiveOrgId(context.session);
    const userId = context.session.user.id;

    const [row] = await db
      .select({ workspaceId: pages.workspaceId })
      .from(pages)
      .innerJoin(workspaces, eq(pages.workspaceId, workspaces.id))
      .where(and(eq(pages.id, data.id), eq(workspaces.organizationId, orgId)))
      .limit(1);
    if (!row) throw new Error("Page not found");
    await authWorkspace(row.workspaceId, userId, orgId);

    await db
      .update(pages)
      .set({ title: data.title, updatedAt: new Date() })
      .where(eq(pages.id, data.id));
    return { ok: true as const };
  });
