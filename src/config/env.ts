/**
 * The environment seen by the content loader, the build integration and the Astro
 * config: variables from `.env` files (loaded the way Vite does) with the process
 * environment taking precedence. One function, so every step reads the same sources.
 */
import { loadEnv } from 'vite';

export function buildEnv(
  root: string,
  mode = process.env.NODE_ENV ?? 'production',
): Record<string, string | undefined> {
  return { ...loadEnv(mode, root, ''), ...process.env };
}
