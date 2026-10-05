/**
 * The profile photo, optimised at build time from `basics.image`. Shared by the photo
 * component and the structured data, so search engines get the site's own copy of the
 * image, not the third-party source URL.
 */
import { getImage } from 'astro:assets';

export type OptimisedPhoto = Awaited<ReturnType<typeof getImage>>;

/**
 * Returns undefined when there is no photo or it cannot be fetched (the page then shows
 * a monogram). With RESUME_STRICT_PHOTO=1, set by the production build, a photo that
 * cannot be fetched is an error instead.
 */
export async function optimisedPhoto(src: string | undefined, size: number): Promise<OptimisedPhoto | undefined> {
  if (!src) return undefined;
  try {
    return await getImage({
      src,
      inferSize: true,
      width: size * 2,
      height: size * 2,
      widths: [Math.round(size * 1.34), size * 2],
      fit: 'cover',
      format: 'webp',
      quality: 82,
    });
  } catch (error) {
    if (process.env.RESUME_STRICT_PHOTO === '1')
      throw new Error(`[photo] ${src} could not be processed`, { cause: error });
    console.warn(`[photo] ${src} could not be processed, using a monogram: ${(error as Error).message}`);
    return undefined;
  }
}
