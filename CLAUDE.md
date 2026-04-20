# Open Notion — Project Context

## What this project is (current direction)

A self-hostable Notion clone. Pages with nested children, a block-based Plate.js editor, and workspace/org auth. The `/newpage` slash command creates a real child page record and navigates to it — it is **not** a page-break / multi-step form divider.

## What this project was

A form builder. The pivot is **forms-as-block**: forms survive as a first-class block type inside pages (see `formEmbed` Plate node). The form-builder UI and nested routes (`workspace/$workspaceId/form-builder/$formId/edit|settings|submissions`) remain — they're now reached from the form-embed block inside a page rather than a top-level "forms" listing.

Retained form tables: `forms`, `form_versions`, `submissions`, `form_favorites`, `form_notification_preferences`, `form_submission_notifications`.

## Migration phases

- **Pass 1 (complete):** docs pivot, remove forced submit button from new editors, add `pages` table, add `/newpage` slash command that creates a real page.
- **Pass 2 (in progress):**
  - Stage A (complete): dropped unused analytics tables (`form_visits`, `form_analytics_daily`, `form_dropoff_daily`, `form_question_progress`).
  - Stage B (complete): added `formEmbed` Plate block node + slash command entry.
  - Stage C (partial): form-builder routes stay in place; reach them via the embed block, not top-level nav. Actual physical move is deferred — too much UI chrome (`_authenticated.tsx`, `app-header`, form-builder sidebars) hardcodes the path.
  - Stage D (not started): sidebar page tree.
- **Pass 3 (not started):** permissions, public pages, search, trash/restore, backlinks.

## Stack

- Runtime: Cloudflare Workers via `@cloudflare/vite-plugin` in dev, `wrangler deploy` in prod.
- DB: Cloudflare D1 (SQLite) + Drizzle ORM (`drizzle-orm@1.0.0-beta`).
- Auth: Better Auth with magic link, API key, organization, Polar plugins.
- Editor: Plate.js (`platejs@52`).
- Framework: TanStack Start + TanStack Router (file-based) + TanStack DB (local-first) + TanStack Query.
- Styling: Tailwind v4 + shadcn/ui.

## Local dev

- Dev server: `bun run dev` on `http://localhost:3001` (pinned via `strictPort`).
- Local D1 migrations: `bun run db:migrate:local`.
  - ⚠ `@cloudflare/vite-plugin` and `wrangler` CLI can write to different local sqlite files under `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/`. If `wrangler` reports "no migrations to apply" but the dev server hits `no such table`, check which sqlite is the active one (mtime on the file after running `bun run dev`) and either copy the populated file over the empty one, or run the migration SQL directly against the active file.
- Closer-to-prod runtime: `bun run preview` (`wrangler dev`).

## Code standards

See [`AGENTS.md`](AGENTS.md). Ultracite / oxlint / oxfmt enforced. Run `bun run fix` before committing.

## Things to be careful about

- **Better Auth URL is anchored at boot.** Don't try to make it auto-follow whatever port Vite chose — cookie domain and magic-link callback URLs must match the URL the user's browser is on. Port is pinned at 3001 in `vite.config.ts` / `package.json` / `.env` for exactly this reason.
- **Devtools are Solid.js under the hood.** `React.lazy` around them would trigger SSR loads of `solid-js/web`; the `<ClientOnly>` wrapper in `src/routes/__root.tsx` is load-bearing — don't remove it.
- **Form node types are still referenced across the editor kit.** Removing `formButton` etc. without auditing `form-blocks-kit.tsx`, `transforms.ts`, and `migrate-editor-content.ts` will crash existing form content. Keep them registered until Pass 2 makes a clear forms-as-block vs. delete decision.
