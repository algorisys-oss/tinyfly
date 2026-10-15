import { mount, type MountedEmbed, type MountOptions } from '../../embed/mount'
import type { TinyflyPlayer } from '../../player/player'
import type { MathFigureSpec } from '../figure/figure-spec'
import { layoutFigure, type MathProps } from '../figure/layout-figure'
import { validateMathFigure } from '../figure/validate-spec'
import { displayListToSvgContent } from '../render/display-list-to-svg'

/**
 * Maths figures in lesson pages, stepped like any tinyfly embed:
 *
 *     <figure data-tinyfly-math data-target="fig" data-options='{"stepMode": true}'>
 *       <script type="application/json" data-tinyfly-figure>{ …MathFigureSpec… }</script>
 *       <script type="application/json" data-tinyfly-timeline>{ …timeline JSON… }</script>
 *       <figcaption>A shear keeps î and slides ĵ.</figcaption>
 *     </figure>
 *
 * The figure is drawn into an `<svg>` it creates, and redrawn from the
 * timeline's values (tracks whose target is `data-target`, default `fig`)
 * every time the player moves: playing, stepping, seeking, or showing the
 * final frame under reduced motion. Everything else (markers, step controls,
 * captions, questions, scenarios, pausing off screen) is the ordinary embed.
 */
export interface MountedMathFigure {
  element: HTMLElement
  /** The embed's player; absent for a still figure with no timeline */
  player?: TinyflyPlayer
  controls?: MountedEmbed['controls']
  figure: MathFigureSpec
  /** Draw now (the player redraws on its own; call after changing values yourself) */
  redraw(): void
}

const SVG_NS = 'http://www.w3.org/2000/svg'
const mountedFigures = new WeakMap<Element, MountedMathFigure>()

/** The figure's values for one target from a player state. */
function propsOf(state: { values: Map<string, Map<string, unknown>> } | undefined, target: string): MathProps {
  const values = state?.values.get(target)
  return values ? (Object.fromEntries(values) as MathProps) : {}
}

/** Mount one maths figure (idempotent). */
export async function mountMath(element: HTMLElement, options: MountOptions = {}): Promise<MountedMathFigure | undefined> {
  const existing = mountedFigures.get(element)
  if (existing) return existing
  const script = element.querySelector('script[data-tinyfly-figure]')
  let figure: MathFigureSpec
  try {
    figure = validateMathFigure(JSON.parse(script?.textContent ?? 'null') as MathFigureSpec)
  } catch (error) {
    console.warn('tinyfly: math figure is missing or invalid', element, error)
    return undefined
  }
  const target = element.getAttribute('data-target') ?? 'fig'

  let svg = element.querySelector('svg[data-tinyfly-math-svg]') as SVGSVGElement | null
  if (!svg) {
    svg = element.ownerDocument.createElementNS(SVG_NS, 'svg') as SVGSVGElement
    svg.setAttribute('data-tinyfly-math-svg', '')
    svg.setAttribute('viewBox', `0 0 ${figure.width} ${figure.height}`)
    svg.setAttribute('style', 'display:block;width:100%;height:auto')
    element.insertBefore(svg, element.querySelector('figcaption'))
  }
  const draw = (props: MathProps) => {
    svg!.innerHTML = displayListToSvgContent(layoutFigure(figure, props))
  }
  // The first frame, before the player loads (and if it never does).
  draw({})

  const hasTimeline = element.querySelector('script[data-tinyfly-timeline]') || element.hasAttribute('data-src')
  if (!hasTimeline) {
    const still: MountedMathFigure = { element, figure, redraw: () => draw({}) }
    mountedFigures.set(element, still)
    return still
  }
  const embed = await mount(element, options)
  if (!embed) return undefined
  const redraw = () => draw(propsOf(embed.player.state, target))
  embed.player.subscribe(redraw)
  redraw()
  const entry: MountedMathFigure = { ...embed, figure, redraw }
  mountedFigures.set(element, entry)
  return entry
}

/** Mount every `[data-tinyfly-math]` figure in `root` (default the document). */
export async function mountAllMath(root: ParentNode = document, options: MountOptions = {}): Promise<MountedMathFigure[]> {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-tinyfly-math]'))
  const results = await Promise.all(elements.map((element) => mountMath(element, options)))
  return results.filter((entry): entry is MountedMathFigure => entry !== undefined)
}
