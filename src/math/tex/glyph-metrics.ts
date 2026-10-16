/**
 * Fixed glyph metrics for typesetting equations, in ems.
 *
 * Equations are laid out from this table, never from a font's measurements,
 * so the same TeX gives the same positions in a browser, a Web Worker and
 * Node (the precedent is the whiteboard's and code panel's fixed cells).
 * Each glyph is drawn centred in its advance, so a font that is a little
 * wider or narrower than the table still sits where the layout put it.
 *
 * The widths approximate Computer Modern / Latin Modern, the faces listed
 * first in MATH_FONT.
 */
export const MATH_FONT = '"Latin Modern Math", "STIX Two Math", "Cambria Math", "Times New Roman", "Liberation Serif", "Noto Serif", Times, serif'

/**
 * Font for operators and symbols (∪ ∩ △ ∈ ≤ ∑ …): maths faces first, then
 * DejaVu, whose serif and maths faces cover them where text serifs such as
 * Liberation Serif do not. Letters, digits and Greek use MATH_FONT.
 */
export const MATH_SYMBOL_FONT = '"Latin Modern Math", "STIX Two Math", "Cambria Math", "DejaVu Math TeX Gyre", "DejaVu Serif", serif'

/** The font a glyph is drawn in: MATH_FONT for letters, digits and Greek, MATH_SYMBOL_FONT for the rest. */
export const fontFor = (text: string) => (/^[A-Za-z0-9\u0370-\u03ff.,;:!?()[\]'"/ ]+$/.test(text) ? MATH_FONT : MATH_SYMBOL_FONT)

/** Height above the baseline of the maths axis (where fraction bars and − sit). */
export const AXIS_HEIGHT = 0.25

/** Rule thickness for fraction bars and radicals. */
export const RULE = 0.05

/** Latin Modern advance widths for Latin letters, in ems. */
const LETTERS: Record<string, number> = {
  a: 0.5, b: 0.56, c: 0.44, d: 0.56, e: 0.44, f: 0.31, g: 0.5, h: 0.56, i: 0.28, j: 0.31, k: 0.53, l: 0.28, m: 0.83,
  n: 0.56, o: 0.5, p: 0.56, q: 0.53, r: 0.39, s: 0.39, t: 0.39, u: 0.56, v: 0.53, w: 0.72, x: 0.53, y: 0.53, z: 0.44,
  A: 0.75, B: 0.71, C: 0.72, D: 0.76, E: 0.68, F: 0.65, G: 0.78, H: 0.75, I: 0.36, J: 0.51, K: 0.78, L: 0.63, M: 0.92,
  N: 0.75, O: 0.78, P: 0.68, Q: 0.78, R: 0.74, S: 0.56, T: 0.72, U: 0.75, V: 0.75, W: 1.03, X: 0.75, Y: 0.75, Z: 0.61,
}

/** Advance width of one glyph, in ems at size 1. */
export function advance(text: string): number {
  if (text.length !== 1) return text.length * 0.5
  if (/[0-9]/.test(text)) return 0.5
  // Maths italic letters run a little wider than upright text.
  if (Object.prototype.hasOwnProperty.call(LETTERS, text)) return LETTERS[text] + 0.04
  if ('()[]'.includes(text)) return 0.39
  if ('{}'.includes(text)) return 0.5
  if ('|'.includes(text)) return 0.28
  if (',.;:!'.includes(text)) return 0.28
  if ("'’‘".includes(text)) return 0.28
  if ('-‐'.includes(text)) return 0.33
  if ('′″'.includes(text)) return 0.3
  if ('+−=<>±×÷≤≥≠≈∼≡∝→←↔⇒⇔∈∉⊂⊃⊆⊇∪∩∧∨'.includes(text)) return 0.78
  if ('·∘'.includes(text)) return 0.28
  if ('∑∏'.includes(text)) return 1.05
  if ('∫'.includes(text)) return 0.56
  if ('∞'.includes(text)) return 1.0
  if ('…⋯'.includes(text)) return 1.0
  if (/[Α-Ω]/.test(text)) return 0.72 // Greek capitals
  if (/[α-ω]/.test(text)) return 0.56 // Greek lowercase
  return 0.6
}

/** Height above and depth below the baseline, in ems at size 1. */
export function extent(text: string): { height: number; depth: number } {
  if ('gjpqy(),;[]{}|∫'.includes(text) || 'βγζημξρφχψ'.includes(text)) return { height: 0.72, depth: 0.22 }
  if ('∑∏'.includes(text)) return { height: 0.75, depth: 0.25 }
  if (/[a-z]/.test(text) && !'bdfhklt'.includes(text)) return { height: 0.45, depth: 0 }
  return { height: 0.7, depth: 0 }
}
