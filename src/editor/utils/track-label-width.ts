/**
 * Width of the timeline's track-label column, in pixels.
 *
 * This is the distance from the left edge of the timeline to time zero, so the
 * ruler, the keyframe lanes and every hit test have to agree on it. The value
 * lives in CSS (`--track-label-w` on `.timeline-panel`) because that is what
 * actually lays the column out, and it narrows at the mobile breakpoints —
 * hard-coding 120 in JS silently mis-tested every drag and box-select on a
 * phone.
 *
 * `el` is any node inside the timeline panel. The lookup climbs to the panel
 * that declares the property rather than relying on inherited-value resolution,
 * which is uneven across DOM implementations. Falls back to the desktop width
 * when the property is missing — before styles load, or outside a panel — since
 * a wrong-but-sane origin beats collapsing every hit test to 0.
 */
export const DEFAULT_TRACK_LABEL_WIDTH = 120

const HOST_SELECTOR = '.timeline-panel'
const PROPERTY = '--track-label-w'

export function trackLabelWidth(el: Element | null | undefined): number {
  if (!el || typeof getComputedStyle !== 'function') return DEFAULT_TRACK_LABEL_WIDTH

  const host = el.closest?.(HOST_SELECTOR) ?? el
  const parsed = parseFloat(getComputedStyle(host).getPropertyValue(PROPERTY).trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TRACK_LABEL_WIDTH
}
