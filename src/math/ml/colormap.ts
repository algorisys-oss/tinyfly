/**
 * Colour scales for heatmaps, as plain functions of 0..1 (clamped):
 * `viridis` (dark blue to yellow, readable in grey), `heat` (dark to orange
 * to pale yellow), `diverging` (blue, white, red; for signed values).
 */
export type Colormap = 'viridis' | 'heat' | 'diverging'
export const COLORMAPS: readonly Colormap[] = ['viridis', 'heat', 'diverging']

const STOPS: Record<Colormap, [number, number, number][]> = {
  viridis: [[68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]],
  heat: [[20, 12, 30], [120, 28, 60], [214, 70, 40], [250, 160, 50], [252, 240, 180]],
  diverging: [[49, 99, 185], [140, 180, 225], [245, 245, 245], [235, 140, 120], [190, 40, 50]],
}

export function colorAt(map: Colormap, t: number): string {
  const stops = STOPS[map]
  const u = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0)) * (stops.length - 1)
  const k = Math.min(stops.length - 2, Math.floor(u))
  const f = u - k
  // Hex, which every renderer reads (2D canvas, SVG and scene-3d's mesh colours).
  return `#${stops[k].map((v, i) => Math.round(v + (stops[k + 1][i] - v) * f).toString(16).padStart(2, '0')).join('')}`
}

/** [r, g, b] from `#rgb`, `#rrggbb` or `rgb(r, g, b)`; undefined for anything else. */
function rgbOf(color: string): [number, number, number] | undefined {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(color.trim())
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : undefined
}

/**
 * `color` laid over `background` at `amount` (0..1), as one opaque colour.
 * Neighbouring cells drawn this way can overlap without the darker seams
 * that overlapping translucent fills leave.
 */
export function blendOver(color: string, background: string, amount: number): string {
  const a = rgbOf(color)
  const b = rgbOf(background)
  if (!a || !b) return color
  const t = Math.min(1, Math.max(0, amount))
  const [r, g, bl] = a.map((v, i) => Math.round(b[i] + (v - b[i]) * t))
  return `rgb(${r}, ${g}, ${bl})`
}
