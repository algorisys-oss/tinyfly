import type { TextElement } from '../stores/scene-store'

/**
 * Layout information for a single glyph produced by splitting a text element.
 *
 * Coordinates are absolute (artboard space), matching the coordinate system of
 * the source element, so each letter can become a stand-alone scene element.
 */
export interface LetterLayout {
  /** The character this box holds (never whitespace — spaces only advance x). */
  char: string
  /** Index of the character within the original, non-whitespace-filtered string. */
  index: number
  /** Absolute x of the letter box (top-left). */
  x: number
  /** Absolute y of the letter box (top-left). */
  y: number
  /** Width of the letter box (the measured advance for this glyph). */
  width: number
  /** Height of the letter box (inherited from the source element). */
  height: number
}

// A single shared measuring context. Created lazily so this module is safe to
// import in non-DOM environments (Web Workers, tests) — it just falls back to an
// approximate metric when no 2D canvas is available.
let measureCtx: CanvasRenderingContext2D | null | undefined

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) return measureCtx
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas')
      measureCtx = canvas.getContext('2d')
    } else {
      measureCtx = null
    }
  } catch {
    measureCtx = null
  }
  return measureCtx
}

/**
 * Build the CSS `font` shorthand for a text element, used for measurement.
 */
export function textElementFont(element: TextElement): string {
  return `${element.fontWeight} ${element.fontSize}px ${element.fontFamily}`
}

/**
 * Measure the advance width of a single character for a given font.
 *
 * Uses a real 2D canvas when available; otherwise falls back to an approximation
 * (roughly 0.6em per glyph) so the function stays deterministic and testable in
 * non-DOM environments. The engine never depends on this — it is an editor-only
 * authoring helper.
 */
function measureChar(char: string, font: string, fontSize: number): number {
  const ctx = getMeasureContext()
  if (ctx) {
    ctx.font = font
    const w = ctx.measureText(char).width
    if (w > 0) return w
  }
  // Fallback: spaces are narrower than glyphs.
  return char === ' ' ? fontSize * 0.3 : fontSize * 0.6
}

export interface SplitTextOptions {
  /**
   * When true, letters are laid out using their measured widths so the split
   * closely reproduces the original visual layout. When false, all letters get
   * an equal slice of the element width. Defaults to true.
   */
  proportional?: boolean
}

/**
 * Compute per-letter layout boxes for a text element.
 *
 * The whole string is measured, then positioned inside the element's box
 * honouring `textAlign`, so the letters together occupy the same visual span as
 * the original single text element. Whitespace advances the cursor but does not
 * produce a box (there is nothing visible to animate).
 *
 * This is pure geometry: given the same element it always returns the same
 * layout, keeping the split deterministic in line with tinyfly's core rules.
 */
export function measureTextLetters(
  element: TextElement,
  options: SplitTextOptions = {}
): LetterLayout[] {
  const proportional = options.proportional ?? true
  const chars = [...element.text]
  if (chars.length === 0) return []

  const font = textElementFont(element)

  // Measured advance for every character (including whitespace).
  const advances = chars.map((c) =>
    proportional
      ? measureChar(c, font, element.fontSize)
      : element.width / chars.length
  )
  const totalWidth = advances.reduce((sum, w) => sum + w, 0)

  // Horizontal origin so the measured string sits inside the element box
  // according to its alignment.
  let originX = element.x
  if (element.textAlign === 'center') {
    originX = element.x + (element.width - totalWidth) / 2
  } else if (element.textAlign === 'right') {
    originX = element.x + element.width - totalWidth
  }

  const letters: LetterLayout[] = []
  let cursor = originX
  chars.forEach((char, index) => {
    const width = advances[index]
    if (char.trim() !== '') {
      letters.push({
        char,
        index,
        x: cursor,
        y: element.y,
        width,
        height: element.height,
      })
    }
    cursor += width
  })

  return letters
}
