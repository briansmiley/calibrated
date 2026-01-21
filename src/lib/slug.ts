/**
 * Generate a URL-friendly slug from text
 */
export function generateSlug(text: string, maxLength: number = 30): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .slice(0, maxLength)       // Limit length
    .replace(/-$/, '')         // Remove trailing hyphen
}

/**
 * Validate a slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 50
}
