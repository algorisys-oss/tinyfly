/**
 * Shared maths for the "shine sweep": a bright highlight band that travels
 * across an element's fill, used by the Canvas and SVG adapters (the DOM adapter
 * uses a CSS background-clip:text gradient instead).
 *
 * Given a sweep progress (0..1) and a base colour, it returns gradient stops
 * (offset 0..1) describing a base fill with a moving highlight. When the band is
 * off either edge, only the base colour remains, so the element renders normally.
 */
export interface ShineStop {
  offset: number
  color: string
}

export interface ShineOptions {
  /** Highlight colour at the centre of the band. Defaults to white. */
  highlight?: string
  /** Half-width of the band as a fraction of the fill (0..1). Defaults to 0.12. */
  halfWidth?: number
}

/**
 * Compute gradient stops for a shine sweep.
 *
 * `progress` runs 0..1; the band centre travels from -0.2 (off the left) to 1.2
 * (off the right) so it fully enters and exits.
 */
export function shineStops(
  progress: number,
  baseColor: string,
  options: ShineOptions = {}
): ShineStop[] {
  const highlight = options.highlight ?? '#ffffff'
  const halfWidth = options.halfWidth ?? 0.12
  const center = -0.2 + progress * 1.4

  const stops: ShineStop[] = [{ offset: 0, color: baseColor }]

  // Only include band stops that fall strictly inside (0, 1); base anchors the ends.
  const band: ShineStop[] = [
    { offset: center - halfWidth, color: baseColor },
    { offset: center, color: highlight },
    { offset: center + halfWidth, color: baseColor },
  ]
  for (const stop of band) {
    if (stop.offset > 0 && stop.offset < 1) stops.push(stop)
  }

  stops.push({ offset: 1, color: baseColor })
  stops.sort((a, b) => a.offset - b.offset)
  return stops
}
