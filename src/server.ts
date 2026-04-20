import * as Sentry from "@sentry/cloudflare";
import handler from "@tanstack/react-start/server-entry";

export type RequestContext = {
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
};

declare module "@tanstack/react-router" {
  interface Register {
    server: {
      requestContext: RequestContext;
    };
  }
}

const EMBED_PATH = "/embed/popup.js";

const applyResponseHeaders = (request: Request, response: Response): Response => {
  const url = new URL(request.url);
  // Global cross-origin isolation (wa-sqlite OPFS path). `credentialless` lets
  // third-party CDN assets that don't set CORP headers still load.
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "credentialless");

  if (url.pathname === EMBED_PATH) {
    headers.set("Cache-Control", "public, max-age=300, must-revalidate");
    headers.set("Access-Control-Allow-Origin", "*");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const response = await handler.fetch(request, {
      context: {
        env,
        waitUntil: ctx.waitUntil.bind(ctx),
        passThroughOnException: ctx.passThroughOnException.bind(ctx),
      },
    });
    return applyResponseHeaders(request, response);
  },
} satisfies ExportedHandler<Env>;

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.VITE_SENTRY_DSN,
    sendDefaultPii: true,
    tracesSampleRate: 1.0,
  }),
  worker,
);
