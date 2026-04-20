import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import fs from "node:fs";
import viteTsConfigPaths from "vite-tsconfig-paths";

// Custom Cache-Control headers for the public embed script so updates
// propagate quickly to embedders without requiring a versioned URL.
const setEmbedHeader = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => {
  if (req.url?.startsWith("/embed/popup.js")) {
    res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
  }
  next();
};

const embedCacheHeadersPlugin = (): Plugin => ({
  name: "embed-cache-headers",
  configureServer(server) {
    server.middlewares.use(setEmbedHeader);
  },
  configurePreviewServer(server) {
    server.middlewares.use(setEmbedHeader);
  },
});

// Serves .wasm files directly from /@fs/ paths before TanStack Start's catch-all
// intercepts them. Required by @tanstack/browser-db-sqlite-persistence (wa-sqlite).
const serveWasmFilesPlugin = (): Plugin => ({
  name: "serve-wasm-files",
  configureServer(server) {
    const wasmHandler = (
      req: IncomingMessage,
      res: ServerResponse,
      next: (err?: unknown) => void,
    ) => {
      const urlWithoutQuery = (req.url ?? "").split("?")[0];
      if (!urlWithoutQuery.endsWith(".wasm")) return next();
      const fsPrefix = "/@fs";
      const filePath = urlWithoutQuery.startsWith(fsPrefix)
        ? urlWithoutQuery.slice(fsPrefix.length)
        : undefined;
      if (!filePath || !fs.existsSync(filePath)) return next();
      const content = fs.readFileSync(filePath);
      res.writeHead(200, {
        "Content-Type": "application/wasm",
        "Content-Length": content.byteLength,
        "Cache-Control": "no-cache",
      });
      res.end(content);
    };
    // Unshift so this runs BEFORE TanStack Start's catch-all middleware
    server.middlewares.stack.unshift({ route: "", handle: wasmHandler });
  },
});

// Cross-origin isolation headers required by @tanstack/browser-db-sqlite-persistence
// (wa-sqlite OPFS needs FileSystemFileHandle.createSyncAccessHandle, which is gated
// behind cross-origin isolation / SharedArrayBuffer). `credentialless` avoids
// breaking third-party CDN assets that don't set CORP headers.
const crossOriginIsolationPlugin = (): Plugin => {
  const setHeaders = (_req: IncomingMessage, res: ServerResponse, next: (e?: unknown) => void) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    next();
  };
  return {
    name: "cross-origin-isolation",
    configureServer(server) {
      server.middlewares.use(setHeaders);
    },
    configurePreviewServer(server) {
      server.middlewares.use(setHeaders);
    },
  };
};

const config = defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    serveWasmFilesPlugin(),
    embedCacheHeadersPlugin(),
    crossOriginIsolationPlugin(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      router: {},
    }),
    viteReact(),
  ],
  resolve: {
    dedupe: ["@platejs/core"],
  },
  optimizeDeps: {
    // These packages bundle a Web Worker + wa-sqlite WASM. esbuild's
    // prebundle strips the worker bootstrap and asset references, so they
    // must be loaded as native ESM at runtime.
    exclude: [
      "@tanstack/db",
      "@tanstack/browser-db-sqlite-persistence",
      "@tanstack/db-sqlite-persistence-core",
      "@journeyapps/wa-sqlite",
    ],
  },
  environments: {
    ssr: {
      // Devtools packages pull in solid-js/web which resolves to its `worker`
      // build in the Cloudflare SSR env — but that build lacks `use` and
      // `setStyleProperty` which the devtools bundles import. They are client-
      // only anyway (gated behind NODE_ENV === "development" on the client), so
      // skip them in the SSR prebundle.
      optimizeDeps: {
        exclude: [
          "@tanstack/react-devtools",
          "@tanstack/react-router-devtools",
          "@tanstack/react-hotkeys-devtools",
          "@tanstack/react-pacer-devtools",
          "@tanstack/devtools-utils",
          "@tanstack/hotkeys-devtools",
          "agentation",
          "solid-js/web",
        ],
      },
    },
  },
  server: {
    strictPort: true,
  },
  preview: {
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  ssr: {
    noExternal: [/^@platejs\//, "katex", "react-tweet"],
  },
});

export default config;
