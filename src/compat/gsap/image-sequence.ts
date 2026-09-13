/**
 * Image-sequence scrubbing: a canvas that shows frame N of a numbered image
 * sequence, where N is a plain number you can tween or tie to scroll — the
 * product that turns as you scroll.
 *
 *     const sequence = live.imageSequence('canvas.phone', {
 *       frames: 120,
 *       url: (i) => `/frames/phone_${String(i + 1).padStart(4, '0')}.webp`,
 *     })
 *     live.to(sequence, { frame: sequence.frames - 1, ease: 'none', scrollTrigger: { scrub: true, pin: true } })
 *
 * `frame` is an ordinary property on a plain object, so tinyfly animates it like any
 * other target. Setting it draws the nearest frame; nothing else redraws.
 *
 * Loading: the first frame loads straight away, then the rest load a few at a time,
 * nearest to the frame on screen first. Until a frame has arrived, the nearest one
 * that has is drawn, so scrubbing ahead of the network shows a close frame rather
 * than a blank canvas.
 */

export interface ImageSequenceOptions {
  /** Number of frames */
  frames: number
  /** The URL of frame `index` (0-based) */
  url: (index: number) => string
  /** How images fill the canvas (default 'cover') */
  fit?: 'cover' | 'contain'
  /** Images loading at once (default 6) */
  concurrency?: number
  /** Called as frames arrive */
  onProgress?: (loaded: number, total: number) => void
}

export class ImageSequence {
  readonly frames: number
  private readonly canvas: HTMLCanvasElement
  private readonly context: CanvasRenderingContext2D | null
  private readonly options: ImageSequenceOptions
  private readonly images: (HTMLImageElement | undefined)[]
  private readonly ready: boolean[]
  private current = 0
  private drawn = -1
  private loadedCount = 0
  private inFlight = 0
  private destroyed = false
  private readonly onResize = () => this.resize()

  constructor(canvas: HTMLCanvasElement, options: ImageSequenceOptions) {
    this.canvas = canvas
    this.context = canvas.getContext('2d')
    this.options = options
    this.frames = Math.max(1, Math.floor(options.frames))
    this.images = new Array(this.frames)
    this.ready = new Array(this.frames).fill(false)
    if (typeof window !== 'undefined') window.addEventListener('resize', this.onResize, { passive: true })
    this.resize()
    this.pump()
  }

  /** The frame on screen (fractional values show the nearest frame) */
  get frame(): number {
    return this.current
  }

  set frame(value: number) {
    this.current = Math.max(0, Math.min(this.frames - 1, value))
    this.draw()
  }

  /** How many frames have loaded */
  get loaded(): number {
    return this.loadedCount
  }

  /** Stop loading, forget the images, and stop listening for resizes. */
  destroy(): void {
    this.destroyed = true
    if (typeof window !== 'undefined') window.removeEventListener('resize', this.onResize)
    for (const image of this.images) if (image) image.src = ''
  }

  /** Match the canvas's pixels to its size on screen, then redraw. */
  resize(): void {
    const ratio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const width = Math.round(this.canvas.clientWidth * ratio)
    const height = Math.round(this.canvas.clientHeight * ratio)
    if (width > 0 && height > 0 && (this.canvas.width !== width || this.canvas.height !== height)) {
      this.canvas.width = width
      this.canvas.height = height
    }
    this.drawn = -1
    this.draw()
  }

  private draw(): void {
    const index = Math.round(this.current)
    const available = this.nearestReady(index)
    if (available === -1 || available === this.drawn || !this.context) return
    const image = this.images[available]!
    const { width, height } = this.canvas
    const scale = (this.options.fit ?? 'cover') === 'cover'
      ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
      : Math.min(width / image.naturalWidth, height / image.naturalHeight)
    const drawWidth = image.naturalWidth * scale
    const drawHeight = image.naturalHeight * scale
    this.context.clearRect(0, 0, width, height)
    this.context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
    this.drawn = available
    // Keep loading toward where the viewer is now.
    this.pump()
  }

  /** The loaded frame closest to `index`, or -1. */
  private nearestReady(index: number): number {
    for (let distance = 0; distance < this.frames; distance++) {
      if (index - distance >= 0 && this.ready[index - distance]) return index - distance
      if (index + distance < this.frames && this.ready[index + distance]) return index + distance
    }
    return -1
  }

  /** Start loads, nearest to the current frame first, up to the concurrency. */
  private pump(): void {
    const limit = this.options.concurrency ?? 6
    const centre = Math.round(this.current)
    for (let distance = 0; distance < this.frames && this.inFlight < limit; distance++) {
      for (const index of distance === 0 ? [centre] : [centre + distance, centre - distance]) {
        if (index < 0 || index >= this.frames || this.images[index] || this.inFlight >= limit) continue
        this.load(index)
      }
    }
  }

  private load(index: number): void {
    const image = new Image()
    image.decoding = 'async'
    this.images[index] = image
    this.inFlight++
    const settle = (ok: boolean) => {
      if (this.destroyed) return
      this.inFlight--
      if (ok) {
        this.ready[index] = true
        this.loadedCount++
        this.options.onProgress?.(this.loadedCount, this.frames)
        // A closer frame arriving is worth drawing.
        const target = Math.round(this.current)
        if (Math.abs(index - target) < Math.abs(this.drawn - target) || this.drawn === -1) {
          this.drawn = -1
          this.draw()
        }
      }
      this.pump()
    }
    image.onload = () => settle(true)
    image.onerror = () => settle(false)
    image.src = this.options.url(index)
  }
}
