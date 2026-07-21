/**
 * Turn a human-readable name into a safe download filename.
 *
 * Export filenames are user-supplied, so they have to survive Windows, macOS,
 * and Linux filesystems: reserved characters are dropped rather than escaped,
 * because a download that silently fails is worse than a slightly shorter name.
 */

/**
 * Everything that is *not* a letter, digit, hyphen, dot, space, or underscore.
 *
 * A whitelist beats blacklisting reserved characters: punctuation like `!`, `#`
 * or `&` is technically legal on most filesystems but makes for awkward
 * filenames, and new edge cases can't slip through. Unicode letters are kept, so
 * "Café" survives.
 */
const DISALLOWED = /[^\p{L}\p{N}\-. _]/gu

/** Windows reserved device names, which cannot be used even with an extension. */
const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

/** Filenames longer than this get unwieldy and hit limits on some systems. */
const MAX_LENGTH = 100

/**
 * Slugify a name for use as a download filename (without extension).
 *
 * Returns `fallback` when the input has no usable characters, so callers always
 * get something downloadable.
 */
export function slugifyFilename(name: string, fallback = 'animation'): string {
  const slug = (name ?? '')
    .replace(DISALLOWED, '')
    .trim()
    // Whitespace and underscores become hyphens, then runs collapse.
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .toLowerCase()
    .slice(0, MAX_LENGTH)
    // Slicing can leave a trailing hyphen behind.
    .replace(/-+$/, '')

  if (!slug || RESERVED.test(slug)) return fallback
  return slug
}
