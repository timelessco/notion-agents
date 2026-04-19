import type { KnipConfig } from "knip";

export default {
  entry: [
    "src/routes/**/*.{ts,tsx}", // Routes as entry points
    "src/server.ts", // Cloudflare Workers entry
    "src/embed/*.ts", // Embed scripts
  ],
  project: ["src/**/*.{ts,tsx}"],
  ignore: [
    ".output/**",
    "drizzle/**",
    "public/**",
    "src/routeTree.gen.ts",
    "src/components/ui/**", // shadcn - used dynamically
    "src/components/editor/plugins/**", // plate plugins - library exports
    "src/types/**", // type exports
    "vite.config.ts", // config file default export
  ],
  ignoreDependencies: [
    "@tanstack/router-plugin", // vite plugin
    "tailwind-scrollbar-hide", // tailwind plugin
    "tw-animate-css", // tailwind plugin
    "2026-01-08-platjs", // self-reference
    "katex", // used in CSS
    "@sentry/cloudflare", // used in src/server.ts
    "@sentry/react", // client-side Sentry init
    "better-sqlite3", // used only in tests
    "@types/better-sqlite3",
    "wrangler", // CLI
    "shadcn", // imported in src/styles/styles.css
    "tailwindcss", // vite plugin + CSS @import
    "type-fest", // HasRequiredKeys type import in auth-query.ts
  ],
  ignoreExportsUsedInFile: true,
  rules: {
    unlisted: "off", // dev deps in config files are expected
  },
  compilers: {
    css: (text: string) => [...text.matchAll(/(?<=@)import[^;]+/g)].join("\n"),
  },
} satisfies KnipConfig;
