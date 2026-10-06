/**
 * The photo for the contact card: the source image (`basics.image`), squared and resized
 * to a small JPEG, base64-encoded. Address books read JPEG; a URL is often ignored on import.
 */
import sharp from 'sharp';

export async function vcardPhoto(src: string | undefined): Promise<string | undefined> {
  // Same rule as the page's remote images: https only (http only for a local preview).
  if (!src || !/^https:|^http:\/\/127\.0\.0\.1[:/]/.test(src)) return undefined;
  try {
    const response = await fetch(src, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // rotate(): turn the photo upright from its EXIF orientation, which the JPEG then drops.
    const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
      .rotate()
      .resize(256, 256, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    return jpeg.toString('base64');
  } catch (error) {
    if (process.env.RESUME_STRICT_PHOTO === '1')
      throw new Error(`[vcard] ${src} could not be processed`, { cause: error });
    console.warn(`[vcard] ${src} could not be processed, the card has no photo: ${(error as Error).message}`);
    return undefined;
  }
}
