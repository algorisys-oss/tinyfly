/**
 * Development markers for a scroll driver: where its range starts and ends.
 *
 * Two lines are fixed to the viewport (the scroller's start and end lines: "the
 * trigger fires when the element point reaches here"), and two sit on the page
 * where the element points are (start and end). The range is active while
 * each page marker is past its viewport line. Turn them off before shipping.
 */

export interface MarkerOptions {
  startColor?: string
  endColor?: string
  fontSize?: string
  /** Pixels from the right edge, so several drivers' markers can sit side by side */
  indent?: number
  /** Prefix for the labels, e.g. the section's name */
  id?: string
}

/** Geometry the driver hands over on each refresh. */
export interface MarkerGeometry {
  /** Page offsets (document pixels) of the element points at the start and end */
  startPage: number
  endPage: number
  /** Offsets within the viewport (or scroller) where those points fire */
  startViewport: number
  endViewport: number
}

export class ScrollMarkers {
  private readonly options: MarkerOptions
  private readonly scroller: HTMLElement | null
  private readonly nodes: HTMLElement[] = []
  private readonly scrollerStart: HTMLElement
  private readonly scrollerEnd: HTMLElement
  private readonly start: HTMLElement
  private readonly end: HTMLElement

  constructor(doc: Document, scroller: HTMLElement | null, options: MarkerOptions | true) {
    this.options = options === true ? {} : options
    this.scroller = scroller
    const { startColor = '#3ecf7a', endColor = '#ff5a5a', id } = this.options
    const prefix = id ? `${id} ` : ''
    const make = (label: string, colour: string, fixed: boolean) => {
      const node = doc.createElement('div')
      node.textContent = `${prefix}${label}`
      node.setAttribute('aria-hidden', 'true')
      node.className = 'scroll-marker'
      Object.assign(node.style, {
        position: fixed ? 'fixed' : 'absolute',
        right: `${this.options.indent ?? 0}px`,
        zIndex: '2147483646',
        pointerEvents: 'none',
        borderTop: `1px solid ${colour}`,
        color: colour,
        font: `${this.options.fontSize ?? '11px'} ui-monospace, monospace`,
        padding: '2px 6px',
        whiteSpace: 'nowrap',
        background: 'rgba(0, 0, 0, 0.35)',
      })
      ;(scroller ?? doc.body).appendChild(node)
      this.nodes.push(node)
      return node
    }
    this.scrollerStart = make('scroller-start', startColor, !scroller)
    this.scrollerEnd = make('scroller-end', endColor, !scroller)
    this.start = make('start', startColor, false)
    this.end = make('end', endColor, false)
    if (scroller && getComputedStyle(scroller).position === 'static') scroller.style.position = 'relative'
  }

  /** Place the markers for the latest measurement. */
  place(geometry: MarkerGeometry, scrollOffset: number): void {
    this.start.style.top = `${geometry.startPage}px`
    this.end.style.top = `${geometry.endPage}px`
    // Inside a scroller the viewport lines move with its content, so they are
    // placed at the scroll offset and re-placed as it scrolls.
    const base = this.scroller ? scrollOffset : 0
    this.scrollerStart.style.top = `${base + geometry.startViewport}px`
    this.scrollerEnd.style.top = `${base + geometry.endViewport}px`
  }

  /** Keep the viewport lines in place inside a scrolling element. */
  follow(geometry: MarkerGeometry, scrollOffset: number): void {
    if (this.scroller) this.place(geometry, scrollOffset)
  }

  destroy(): void {
    for (const node of this.nodes.splice(0)) node.remove()
  }
}
