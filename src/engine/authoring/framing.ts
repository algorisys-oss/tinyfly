/**
 * Frames and safe areas: the picture's aspect, letterbox bars when a film is
 * wider or taller than its canvas, and the areas titles and action must stay
 * inside. Pure geometry; `drawLetterbox` and `drawSafeAreas` paint them.
 */

/** Common aspects, width over height. */
export const FRAME_ASPECTS = {
  '16:9': 16 / 9,
  '2.39:1': 2.39,
  '4:3': 4 / 3,
  '1:1': 1,
  '9:16': 9 / 16,
  '4:5': 4 / 5,
} as const

export type FrameAspectName = keyof typeof FRAME_ASPECTS

export interface FrameRect {
  x: number
  y: number
  width: number
  height: number
}

/** An aspect by name or as width over height. */
export const aspectOf = (aspect: FrameAspectName | number): number => (typeof aspect === 'number' ? aspect : FRAME_ASPECTS[aspect])

/** The frame of the given aspect that fits centred in a canvas: the picture inside the letterbox (or pillarbox) bars. */
export function frameRect(canvas: { width: number; height: number }, aspect: FrameAspectName | number): FrameRect {
  const target = aspectOf(aspect)
  const own = canvas.width / canvas.height
  if (target >= own) {
    const height = canvas.width / target
    return { x: 0, y: (canvas.height - height) / 2, width: canvas.width, height }
  }
  const width = canvas.height * target
  return { x: (canvas.width - width) / 2, y: 0, width, height: canvas.height }
}

/** A size of the given aspect at a width (or a height), whole pixels, even so video encoders are happy. */
export function frameSize(aspect: FrameAspectName | number, size: { width: number } | { height: number }): { width: number; height: number } {
  const ratio = aspectOf(aspect)
  const even = (v: number) => Math.max(2, Math.round(v / 2) * 2)
  if ('width' in size) return { width: even(size.width), height: even(size.width / ratio) }
  return { width: even(size.height * ratio), height: even(size.height) }
}

export interface SafeAreas {
  /** Action safe: what must be seen on every screen (default 90% of the frame) */
  action: FrameRect
  /** Title safe: where text goes (default 80%) */
  title: FrameRect
}

/** The safe areas of a frame, as rectangles inset from it. */
export function safeAreas(frame: FrameRect, shares: { action?: number; title?: number } = {}): SafeAreas {
  const inset = (share: number): FrameRect => ({
    x: frame.x + (frame.width * (1 - share)) / 2,
    y: frame.y + (frame.height * (1 - share)) / 2,
    width: frame.width * share,
    height: frame.height * share,
  })
  return { action: inset(shares.action ?? 0.9), title: inset(shares.title ?? 0.8) }
}
