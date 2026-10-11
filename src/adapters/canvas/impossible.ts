import type { IsoFace } from '../../engine/path/impossible'

/** How an isometric figure's faces are coloured: by the side they face, with an outline. */
export interface IsoFaceStyle {
  /** Fills for the three sides (defaults: a light top, mid left, dark right) */
  top?: string
  left?: string
  right?: string
  /** A fill per face, over the sides' (a bar's or a step's own colour) */
  fill?: (face: IsoFace) => string | undefined
  /** Outline colour (default none) and width, px */
  outline?: string
  lineWidth?: number
}

/** Fill (and outline) faces in the order given: `isometricFaces` gives them far to near. */
export function drawIsometricFaces(ctx: CanvasRenderingContext2D, faces: ReadonlyArray<IsoFace>, style: IsoFaceStyle = {}): void {
  const sides = { top: style.top ?? '#f3f4f6', left: style.left ?? '#9ca3af', right: style.right ?? '#4b5563' }
  ctx.save()
  ctx.lineJoin = 'round'
  for (const face of faces) {
    ctx.beginPath()
    face.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.closePath()
    ctx.fillStyle = style.fill?.(face) ?? sides[face.side]
    ctx.fill()
    if (style.outline) {
      ctx.strokeStyle = style.outline
      ctx.lineWidth = style.lineWidth ?? 2
      ctx.stroke()
    }
  }
  ctx.restore()
}
