/**
 * The header image (`meta.themeOptions.cover`), optimised at build time like the photo:
 * fetched once, resized to a few widths, served from the site itself.
 */
import { getImage } from 'astro:assets';

export type OptimisedCover = Awaited<ReturnType<typeof getImage>>;

/** Widths for a band that spans the page frame (66rem) on screens up to 2x. */
const WIDTHS = [720, 1080, 1600, 2160];

/**
 * Returns undefined when the image cannot be fetched (the page then has no cover). With
 * RESUME_STRICT_PHOTO=1, set by the production build, that is an error instead.
 */
export async function optimisedCover(src: string | undefined): Promise<OptimisedCover | undefined> {
  if (!src) return undefined;
  try {
    return await getImage({ src, inferSize: true, widths: WIDTHS, format: 'webp', quality: 80 });
  } catch (error) {
    if (process.env.RESUME_STRICT_PHOTO === '1')
      throw new Error(`[cover] ${src} could not be processed`, { cause: error });
    console.warn(`[cover] ${src} could not be processed, the page has no cover: ${(error as Error).message}`);
    return undefined;
  }
}
