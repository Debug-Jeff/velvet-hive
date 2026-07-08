const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

/**
 * Routes an external image URL (e.g. a product's imageUrl seeded from
 * products-all.json) through Cloudinary's "fetch" delivery type - Cloudinary
 * downloads, caches, and serves it from their CDN with automatic
 * format/quality optimization, without needing to re-upload the image
 * ourselves. Falls back to the original URL if no cloud name is configured
 * (e.g. local dev without Cloudinary env vars set).
 */
export function optimizedImageUrl(originalUrl: string): string {
  if (!CLOUD_NAME || !originalUrl) return originalUrl
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/f_auto,q_auto/${encodeURIComponent(originalUrl)}`
}
