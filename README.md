# Open Notion

A self-hostable, open-source Notion clone. Create pages, nest them into a tree, write rich block-based content, and share them — no multi-step forms, no submit buttons, just documents.

> This project was originally a form builder. It is being pivoted into a Notion-style page editor. Some form-centric code (submissions, analytics, page-break blocks) still exists during the transition and will be pruned as the page model lands. See [`docs/plans/`](docs/plans/) for the migration plan.

## Features

- **Block-based page editor** — Rich content editing powered by Plate.js: headings, lists, checklists, callouts, tables, code blocks, math, media, and more.
- **Nested pages** — `/newpage` creates a real child page and navigates to it, just like Notion. Pages can be arbitrarily nested via `parent_id`.
- **AI assistance** — Inline content generation and editing.
- **Workspaces & organizations** — Multi-tenant workspaces with invites and role-based access.
- **Auth** — Email/password, magic link, API keys, Google OAuth, 2FA via Better Auth.
- **Billing** — Subscriptions via Polar.
- **Theme support** — Light / dark / system.

## Tech stack

| Layer      | Technology                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------- |
| Framework  | [TanStack Start](https://tanstack.com/start) (Vite + React 19)                                      |
| Routing    | [TanStack Router](https://tanstack.com/router) (file-based, type-safe)                              |
| Data       | [TanStack DB](https://tanstack.com/db) (local-first) + [TanStack Query](https://tanstack.com/query) |
| Database   | [Cloudflare D1](https://developers.cloudflare.com/d1/) + [Drizzle ORM](https://orm.drizzle.team)    |
| Storage    | [Cloudflare R2](https://developers.cloudflare.com/r2/) (file uploads)                               |
| Runtime    | [Cloudflare Workers](https://workers.cloudflare.com/) (via `@cloudflare/vite-plugin`)               |
| Auth       | [Better Auth](https://www.better-auth.com)                                                          |
| Editor     | [Plate.js](https://platejs.org)                                                                     |
| UI         | [shadcn/ui](https://ui.shadcn.com) + [Tailwind CSS v4](https://tailwindcss.com)                     |
| AI         | [Vercel AI SDK](https://sdk.vercel.ai)                                                              |
| Payments   | [Polar](https://polar.sh)                                                                           |
| Monitoring | [Sentry](https://sentry.io)                                                                         |

## Prerequisites

- [Bun](https://bun.sh) (runtime and package manager)
- A Cloudflare account (only needed for `wrangler deploy`; local dev uses miniflare via the vite plugin)

## Getting started

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd open-notion
   bun install
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Fill in `BETTER_AUTH_URL`, OAuth keys, Polar keys, etc. `BETTER_AUTH_URL` defaults to `http://localhost:3001` to avoid clashing with other dev servers on port 3000.

3. **Database (local D1 via miniflare)**

   ```bash
   bun run db:generate        # generate drizzle migrations from schema
   bun run db:migrate:local   # apply to local miniflare D1
   ```

4. **Dev server**

   ```bash
   bun run dev
   ```

   Runs on `http://localhost:3001` (pinned via `strictPort: true`).

## Scripts

| Command                     | Description                               |
| --------------------------- | ----------------------------------------- |
| `bun run dev`               | Vite dev server on :3001                  |
| `bun run preview`           | `wrangler dev` (closer-to-prod runtime)   |
| `bun run build`             | Production build                          |
| `bun run deploy`            | Build and `wrangler deploy` to Cloudflare |
| `bun test`                  | Vitest                                    |
| `bun run lint`              | oxlint + knip                             |
| `bun run fmt`               | oxfmt                                     |
| `bun run check`             | Ultracite checks                          |
| `bun run fix`               | Auto-fix lint + format                    |
| `bun run db:generate`       | Generate Drizzle migrations               |
| `bun run db:migrate:local`  | Apply migrations to local D1              |
| `bun run db:migrate:remote` | Apply migrations to remote D1             |
| `bun run db:studio`         | Drizzle Studio                            |

## Status

This is an active in-progress pivot. See [`CLAUDE.md`](CLAUDE.md) for what's done vs. what's planned, and [`CONTRIBUTING.md`](CONTRIBUTING.md) before sending a PR.
