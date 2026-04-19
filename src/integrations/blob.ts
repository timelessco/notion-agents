import { env } from "cloudflare:workers";

/**
 * Upload bytes to R2 under a public prefix and return the public URL.
 * Mirrors the previous `@vercel/blob` `putBlob` signature so callers don't
 * need to change. `PUBLIC_UPLOADS_URL` is the custom domain bound to the R2
 * bucket (see wrangler.jsonc).
 */
export const putBlob = async (
  key: string,
  body: Buffer | Blob | ArrayBuffer | Uint8Array,
  contentType: string,
): Promise<{ url: string; pathname: string }> => {
  const e = env as unknown as Env;
  const payload: ArrayBuffer | Uint8Array | Blob =
    body instanceof Buffer ? new Uint8Array(body) : body;
  await e.UPLOADS.put(key, payload as ArrayBuffer | Uint8Array | Blob, {
    httpMetadata: { contentType },
  });
  const base = e.PUBLIC_UPLOADS_URL.replace(/\/$/, "");
  return {
    url: `${base}/${key}`,
    pathname: key,
  };
};
