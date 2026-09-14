/**
 * Pinning: hold an element in place while the page scrolls through a range.
 *
 * This automates the `position: sticky` recipe rather than repositioning the
 * element on every scroll event:
 *
 *     <div class="pin-spacer" style="height: <element height + pin distance>">
 *       <section style="position: sticky; top: <where it pins>">…</section>
 *     </div>
 *
 * The spacer takes the element's place in the layout and is exactly as tall as
 * the element plus the distance it stays pinned, so the content after it is
 * pushed down by that distance (GSAP's pin spacing), and the browser's own
 * sticky positioning does the holding — nothing is written while scrolling.
 *
 * The usual sticky caveat applies: an ancestor between the element and the
 * scroller with `overflow: hidden`/`auto` stops it sticking.
 */

export interface ScrollPinOptions {
  /** `'x'` pins in a sideways-scrolling container (sticky `left`). Default `'y'`. */
  axis?: 'x' | 'y'
  /**
   * `false`: the spacer gives back the pinned distance with a negative margin, so
   * content after the pin scrolls up underneath it instead of waiting. Default `true`.
   */
  spacing?: boolean
}

export class ScrollPin {
  readonly element: HTMLElement
  readonly spacer: HTMLElement
  private readonly saved: { position: string; top: string; left: string }
  private readonly axis: 'x' | 'y'
  private readonly spacing: boolean

  constructor(element: HTMLElement, options: ScrollPinOptions = {}) {
    this.element = element
    this.axis = options.axis ?? 'y'
    this.spacing = options.spacing ?? true
    const doc = element.ownerDocument
    this.spacer = doc.createElement('div')
    this.spacer.className = 'pin-spacer'
    this.saved = { position: element.style.position, top: element.style.top, left: element.style.left }
    // Sideways, the spacer sits in the row like the element did.
    if (this.axis === 'x') this.spacer.style.flexShrink = '0'

    element.replaceWith(this.spacer)
    this.spacer.appendChild(element)
  }

  /**
   * Put the element back in the flow for measuring: unstuck, at the top of its
   * spacer, which is where it sits without pinning. The spacer keeps its height,
   * so the page does not change length and the scroll position is not clamped.
   */
  release(): void {
    this.element.style.position = this.saved.position
    this.element.style.top = this.saved.top
    this.element.style.left = this.saved.left
  }

  /** Stick at `topPx` from the scroller's top for `distancePx` of scrolling. */
  apply(topPx: number, distancePx: number): void {
    const distance = Math.max(0, distancePx)
    this.element.style.position = 'sticky'
    if (this.axis === 'x') {
      this.spacer.style.width = `${this.element.offsetWidth + distance}px`
      this.spacer.style.marginRight = this.spacing ? '' : `-${distance}px`
      this.element.style.left = `${topPx}px`
    } else {
      this.spacer.style.height = `${this.element.offsetHeight + distance}px`
      this.spacer.style.marginBottom = this.spacing ? '' : `-${distance}px`
      this.element.style.top = `${topPx}px`
    }
  }

  /** Remove the spacer and restore the element's own styles. */
  destroy(): void {
    this.element.style.position = this.saved.position
    this.element.style.top = this.saved.top
    this.element.style.left = this.saved.left
    if (this.spacer.parentNode) this.spacer.replaceWith(this.element)
  }
}
