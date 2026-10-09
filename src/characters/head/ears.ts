import type { Vec3 } from '../rig/body-plan'
import type { SolvedHead } from '../rig/skeleton'
import type { Pen } from '../look/pen'
import { behindHead, facingOf, onScreen } from './shell'

/**
 * Ears: a small oval on each side of the head, level with the eyes. Seen from
 * the front or behind they stick out past the head's outline (drawn before
 * the head, so it covers their inner half); turned toward the viewer, as the
 * near ear is in profile, they sit on the head with a curl inside.
 */

/** Past this facing an ear is drawn on the head rather than behind it. */
const ON_HEAD = 0.35

const earOf = (side: 1 | -1) => ({ centre: [side * 0.98, -0.02, -0.08] as Vec3, out: [side, 0, -0.12] as Vec3 })

export interface EarDrawOptions {
  lineWidth: number
  skin: string
}

function drawEar(pen: Pen, head: SolvedHead, side: 1 | -1, options: EarDrawOptions, onHead: boolean) {
  const { centre, out } = earOf(side)
  const facing = facingOf(head, out)
  const outline = Math.max(1, options.lineWidth * 0.55)
  const fill = options.skin === 'none' ? null : options.skin
  const h = head.ry * 0.27
  if (!onHead) {
    // Sticking out past the head's outline.
    const at = onScreen(head, [centre[0] * 1.06, centre[1], centre[2]])
    pen.ellipse(at.x, at.y, head.rx * 0.17, h, head.angle, fill, outline)
    return
  }
  const at = onScreen(head, centre)
  const w = head.rx * (0.12 + 0.08 * facing)
  pen.ellipse(at.x, at.y, w, h, head.angle, fill, outline)
  // The curl inside the ear.
  const cos = Math.cos(head.angle)
  const sin = Math.sin(head.angle)
  const curl = Array.from({ length: 9 }, (_, i) => {
    const a = -Math.PI * 0.55 + (i / 8) * Math.PI * 1.1
    const x = Math.cos(a) * w * 0.45 * -side
    const y = Math.sin(a) * h * 0.55
    return { x: at.x + x * cos - y * sin, y: at.y + x * sin + y * cos }
  })
  pen.line(curl, Math.max(0.8, outline * 0.7))
}

/** Ears facing away or edge-on: behind the head. */
export function drawEarsBehind(pen: Pen, ctx: CanvasRenderingContext2D, head: SolvedHead, options: EarDrawOptions): void {
  behindHead(ctx, head, () => {
    for (const side of [1, -1] as const) if (facingOf(head, earOf(side).out) < ON_HEAD) drawEar(pen, head, side, options, false)
  })
}

/** Ears turned toward the viewer: on the head. */
export function drawEarsFront(pen: Pen, head: SolvedHead, options: EarDrawOptions): void {
  for (const side of [1, -1] as const) if (facingOf(head, earOf(side).out) >= ON_HEAD) drawEar(pen, head, side, options, true)
}
