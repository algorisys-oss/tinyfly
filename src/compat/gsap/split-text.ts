/**
 * Split text into characters, words and lines wrapped in spans, so each piece
 * can be animated on its own — GSAP's SplitText.
 *
 *     const split = live.splitText('.headline', { type: 'lines,words', mask: 'lines' })
 *     live.from(split.words, { y: '100%', duration: 0.8, stagger: 0.05 })
 *     split.revert()   // back to the original markup
 *
 * What it does to the markup, so there are no surprises:
 * - Every word becomes `<span class="word">` (inline-block, so it can move and
 *   never breaks in the middle). Spaces stay as plain text between words, so the
 *   text still wraps, selects and copies normally.
 * - `chars` wraps each character of a word in `<span class="char">`, using
 *   grapheme clusters where the browser supports them (an emoji stays whole).
 * - `lines` measures where the browser wrapped the words — once, at split time
 *   — and groups them into `<span class="line">` blocks. Inline markup such as
 *   `<em>` or `<a>` is kept: it is cloned into each line it spans.
 * - `mask` wraps each line, word or char in an `overflow: clip` span, for
 *   reveals that slide text up from behind an edge.
 * - The element gets `aria-label` with its text and the pieces `aria-hidden`, so
 *   a screen reader reads the sentence rather than letter by letter.
 *
 * Lines depend on the element's width. If it can change (a resize), call
 * `revert()` and split again.
 */

export type SplitType = 'chars' | 'words' | 'lines'

export interface SplitTextOptions {
  /** Which pieces to create, comma-separated (default `'chars,words,lines'`) */
  type?: string
  /** Wrap each line, word or char in an overflow-clipping span */
  mask?: SplitType
  charsClass?: string
  wordsClass?: string
  linesClass?: string
  /** Add `aria-label` / `aria-hidden` (default true) */
  aria?: boolean
}

export interface SplitTextResult {
  /** The elements that were split */
  readonly elements: Element[]
  readonly chars: HTMLElement[]
  readonly words: HTMLElement[]
  readonly lines: HTMLElement[]
  /** The mask wrappers, when `mask` was given */
  readonly masks: HTMLElement[]
  /** Restore every element's original markup */
  revert(): void
}

interface Original {
  element: Element
  html: string
  ariaLabel: string | null
}

export function splitText(elements: Element[], options: SplitTextOptions = {}): SplitTextResult {
  const types = new Set((options.type ?? 'chars,words,lines').split(',').map((t) => t.trim()))
  const classes = {
    chars: options.charsClass ?? 'char',
    words: options.wordsClass ?? 'word',
    lines: options.linesClass ?? 'line',
  }
  const aria = options.aria !== false

  const originals: Original[] = []
  const result = { elements, chars: [] as HTMLElement[], words: [] as HTMLElement[], lines: [] as HTMLElement[], masks: [] as HTMLElement[] }

  for (const element of elements) {
    originals.push({ element, html: element.innerHTML, ariaLabel: element.getAttribute('aria-label') })
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim()

    const words = wrapWords(element, classes.words)
    const chars = types.has('chars') ? words.flatMap((word) => wrapChars(word, classes.chars)) : []
    const lines = types.has('lines') ? groupLines(element, words, classes.lines) : []

    if (aria) {
      if (!element.hasAttribute('aria-label') && text) element.setAttribute('aria-label', text)
      for (const word of words) word.setAttribute('aria-hidden', 'true')
    }

    // Words are always wrapped (so they never break mid-word and lines can be
    // measured), but only reported when asked for.
    if (types.has('words')) result.words.push(...words)
    else for (const word of words) word.removeAttribute('class')
    result.chars.push(...chars)
    result.lines.push(...lines)

    const masked = options.mask === 'lines' ? lines : options.mask === 'words' ? words : options.mask === 'chars' ? chars : []
    for (const piece of masked) result.masks.push(wrapInMask(piece, `${classes[options.mask!]}-mask`))
  }

  return {
    ...result,
    revert() {
      for (const { element, html, ariaLabel } of originals) {
        element.innerHTML = html
        if (ariaLabel === null) element.removeAttribute('aria-label')
        else element.setAttribute('aria-label', ariaLabel)
      }
    },
  }
}

/** Replace every text node under `root` with word spans and the spaces between them. */
function wrapWords(root: Element, className: string): HTMLElement[] {
  const doc = root.ownerDocument
  const words: HTMLElement[] = []
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */)
  const textNodes: Text[] = []
  for (let node = walker.nextNode(); node; node = walker.nextNode()) textNodes.push(node as Text)

  for (const node of textNodes) {
    const parts = (node.data.match(/\s+|\S+/g) ?? [])
    if (parts.length === 0) continue
    const fragment = doc.createDocumentFragment()
    for (const part of parts) {
      if (/^\s/.test(part)) {
        fragment.appendChild(doc.createTextNode(part))
        continue
      }
      const word = doc.createElement('span')
      word.className = className
      word.style.display = 'inline-block'
      word.textContent = part
      fragment.appendChild(word)
      words.push(word)
    }
    node.replaceWith(fragment)
  }
  return words
}

function wrapChars(word: HTMLElement, className: string): HTMLElement[] {
  const doc = word.ownerDocument
  const chars = graphemes(word.textContent ?? '').map((grapheme) => {
    const char = doc.createElement('span')
    char.className = className
    char.style.display = 'inline-block'
    char.textContent = grapheme
    return char
  })
  word.replaceChildren(...chars)
  return chars
}

function graphemes(text: string): string[] {
  const Segmenter = (Intl as { Segmenter?: new (locale?: string, options?: { granularity: string }) => { segment(text: string): Iterable<{ segment: string }> } }).Segmenter
  if (Segmenter) return Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(text), (s) => s.segment)
  return Array.from(text)
}

/**
 * Group words into line blocks by where the browser placed them. Everything is
 * measured before anything moves. A word starts a new line when its top is
 * below the middle of the current line's first word; a `<br>` ends a line.
 */
function groupLines(root: Element, words: HTMLElement[], className: string): HTMLElement[] {
  const doc = root.ownerDocument
  const boxes = new Map(words.map((word) => [word, word.getBoundingClientRect()]))

  // The pieces to redistribute, in document order: words, the spaces between
  // them, and line breaks. Walk down into inline elements the words live in.
  const items: Node[] = []
  const collect = (parent: Node) => {
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === 3 || boxes.has(child as HTMLElement) || (child as Element).tagName === 'BR') items.push(child)
      else collect(child)
    }
  }
  collect(root)

  const lines: HTMLElement[] = []
  let line: HTMLElement | null = null
  let lineTop = 0
  let lineHalfHeight = 0
  let breakPending = false
  // The clones of inline ancestors currently open in this line, outermost first.
  let open: { original: Node; clone: Node }[] = []

  const startLine = () => {
    line = doc.createElement('span')
    line.className = className
    line.style.display = 'block'
    lines.push(line)
    open = []
  }

  for (const item of items) {
    if ((item as Element).tagName === 'BR') {
      breakPending = true
      continue
    }

    const box = boxes.get(item as HTMLElement)
    if (box && (!line || breakPending || box.top > lineTop + lineHalfHeight)) {
      startLine()
      lineTop = box.top
      lineHalfHeight = box.height / 2
      breakPending = false
    }
    if (!line) continue // leading whitespace before the first word

    // Re-create the item's inline ancestors inside this line, reusing the ones
    // already open.
    const ancestors: Node[] = []
    for (let node = item.parentNode; node && node !== root; node = node.parentNode) ancestors.unshift(node)
    let shared = 0
    while (shared < open.length && shared < ancestors.length && open[shared].original === ancestors[shared]) shared++
    open.length = shared

    let parent: Node = shared === 0 ? line : open[shared - 1].clone
    for (const ancestor of ancestors.slice(shared)) {
      const clone = ancestor.cloneNode(false)
      parent.appendChild(clone)
      open.push({ original: ancestor, clone })
      parent = clone
    }
    parent.appendChild(item)
  }

  root.replaceChildren(...lines)
  return lines
}

function wrapInMask(piece: HTMLElement, className: string): HTMLElement {
  const mask = piece.ownerDocument.createElement('span')
  mask.className = className
  mask.style.display = piece.style.display === 'block' ? 'block' : 'inline-block'
  mask.style.overflow = 'clip'
  piece.replaceWith(mask)
  mask.appendChild(piece)
  return mask
}
