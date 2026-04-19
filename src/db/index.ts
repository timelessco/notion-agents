import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

// `cloudflare:workers` exposes the Worker env globally, letting us keep the
// existing `import { db } from "@/db"` pattern across the codebase without
// threading `env` through every call site.
export const db = drizzle((env as unknown as Env).DB, {
  schema,
  relations: schema.relations,
});

export type Db = typeof db;
