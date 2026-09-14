import { deserializeTimeline, FORMAT_VERSION, type TimelineDefinition } from '../engine'
import { DOMAdapter } from '../adapters/dom'

/**
 * Build-time tools for embedded animations, with no DOM: validating a timeline
 * against its markup, and rendering a frame into static markup for places that
 * never run JavaScript (RSS, email, print, previews, Open Graph images).
 *
 * Both are used by the `tinyfly` command:
 *
 *     npx tinyfly validate slice.json --markup slice.svg
 *     npx tinyfly render slice.json slice.svg --at end > slice-final.svg
 */

export interface EmbedProblem {
  level: 'error' | 'warning'
  message: string
}

/** The `data-tinyfly` names in a piece of markup. */
export function targetNamesIn(markup: string): string[] {
  const names = new Set<string>()
  for (const match of markup.matchAll(/data-tinyfly\s*=\s*("([^"]*)"|'([^']*)')/g)) names.add(match[2] ?? match[3])
  return [...names]
}

/**
 * Problems that would make an embedded animation wrong or confusing: tracks aimed
 * at elements the markup lacks, markers out of order or outside the animation,
 * keyframes past an explicit duration, captions for markers that do not exist.
 */
export function validateEmbed(definition: TimelineDefinition, options: { markup?: string } = {}): EmbedProblem[] {
  const problems: EmbedProblem[] = []
  const error = (message: string) => problems.push({ level: 'error', message })
  const warning = (message: string) => problems.push({ level: 'warning', message })

  if ((definition.formatVersion ?? 1) > FORMAT_VERSION) {
    error(`format version ${definition.formatVersion} is newer than this tinyfly reads (${FORMAT_VERSION})`)
    return problems
  }
  let duration = 0
  try {
    duration = deserializeTimeline(definition).duration
  } catch (thrown) {
    error(`the timeline does not load: ${thrown instanceof Error ? thrown.message : String(thrown)}`)
    return problems
  }

  const explicit = definition.config?.duration
  if (explicit !== undefined) {
    for (const track of definition.tracks) {
      if (!('keyframes' in track)) continue
      const late = track.keyframes.filter((keyframe) => keyframe.time > explicit)
      if (late.length > 0) error(`track "${track.id}" has a keyframe at ${late[0].time}ms, after the ${explicit}ms duration`)
    }
  }

  const markers = definition.config?.markers ?? []
  const ids = new Set<string>()
  markers.forEach((marker, index) => {
    if (ids.has(marker.id)) error(`marker id "${marker.id}" is used more than once`)
    ids.add(marker.id)
    if (marker.time < 0 || marker.time > duration) error(`marker "${marker.id}" at ${marker.time}ms is outside the animation (0–${duration}ms)`)
    if (index > 0 && marker.time < markers[index - 1].time) error(`marker "${marker.id}" comes before "${markers[index - 1].id}" in time; list markers in order`)
  })

  for (const [language, captions] of Object.entries(definition.captions ?? {})) {
    for (const id of Object.keys(captions)) {
      if (!ids.has(id)) error(`caption "${id}" (${language}) has no marker with that id`)
    }
    for (const id of ids) {
      if (!(id in captions)) warning(`marker "${id}" has no ${language} caption; its label is shown instead`)
    }
  }

  if (options.markup !== undefined) {
    const names = new Set(targetNamesIn(options.markup))
    const used = new Set<string>()
    for (const track of definition.tracks) {
      for (const target of [track.target, ...(track.targets ?? [])]) {
        used.add(target)
        if (!names.has(target)) error(`track "${track.id}" targets "${target}", but no element has data-tinyfly="${target}"`)
      }
    }
    for (const name of names) if (!used.has(name)) warning(`data-tinyfly="${name}" is never animated`)
  }
  return problems
}

/** Which frame to render: the start, the end, a time in ms, or a marker id. */
export type FrameAt = 'start' | 'end' | number | string

/**
 * The markup with the animation's state at one moment written into each
 * animated element's `style` (and text), so it shows that frame with no script.
 * Styles are appended to any the element already has, so they win.
 */
export function renderFrame(markup: string, definition: TimelineDefinition, at: FrameAt = 'end'): string {
  const timeline = deserializeTimeline(definition)
  const markers = definition.config?.markers ?? []
  const time =
    at === 'start' ? 0 : at === 'end' ? timeline.duration : typeof at === 'number' ? at : (markers.find((marker) => marker.id === at)?.time ?? timeline.duration)
  const state = timeline.getStateAtTime(Math.max(0, Math.min(timeline.duration, time)))

  // Let the DOM adapter decide the styles, on stand-in elements that record them.
  const adapter = new DOMAdapter()
  const recorders = new Map<string, StandIn>()
  const inSvg = svgRanges(markup)
  for (const match of markup.matchAll(START_TAG)) {
    const name = /data-tinyfly\s*=\s*("([^"]*)"|'([^']*)')/.exec(match[2] ?? '')
    if (!name) continue
    const target = name[2] ?? name[3]
    if (recorders.has(target)) continue
    const standIn = createStandIn(inSvg(match.index ?? 0))
    recorders.set(target, standIn)
    adapter.registerTarget(target, standIn as unknown as HTMLElement)
  }
  adapter.applyState(state)

  let output = ''
  let last = 0
  for (const match of markup.matchAll(START_TAG)) {
    const [tag, tagName, attributes = '', selfClosing] = match
    const start = match.index ?? 0
    const name = /data-tinyfly\s*=\s*("([^"]*)"|'([^']*)')/.exec(attributes)
    const standIn = name ? recorders.get(name[2] ?? name[3]) : undefined
    if (!standIn || (Object.keys(standIn.style).length === 0 && standIn.text === undefined)) continue

    output += markup.slice(last, start)
    const css = Object.entries(standIn.style)
      .map(([property, value]) => `${kebab(property)}: ${value}`)
      .join('; ')
    const existing = /\sstyle\s*=\s*("([^"]*)"|'([^']*)')/.exec(attributes)
    let newAttributes = attributes
    if (css) {
      if (existing) {
        const merged = `${(existing[2] ?? existing[3]).trim().replace(/;?$/, ';')} ${css}`.trim()
        newAttributes = attributes.replace(existing[0], ` style="${escapeAttribute(merged)}"`)
      } else {
        newAttributes = `${attributes} style="${escapeAttribute(css)}"`
      }
    }
    output += `<${tagName}${newAttributes}${selfClosing ? ' /' : ''}>`
    last = start + tag.length

    // Text: replace the element's own text when it holds nothing but text.
    if (standIn.text !== undefined && !selfClosing) {
      const close = markup.indexOf(`</${tagName}`, last)
      const inner = close === -1 ? '' : markup.slice(last, close)
      if (close !== -1 && !inner.includes('<')) {
        output += escapeText(standIn.text)
        last = close
      }
    }
  }
  return output + markup.slice(last)
}

const START_TAG = /<([a-zA-Z][\w:-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g

interface StandIn {
  style: Record<string, string>
  text?: string
  dataset: Record<string, string>
  namespaceURI: string
  childNodes: never[]
  textContent: string
  ownerSVGElement?: null
}

function createStandIn(svg: boolean): StandIn {
  const standIn: StandIn = {
    style: {},
    dataset: {},
    namespaceURI: svg ? 'http://www.w3.org/2000/svg' : 'http://www.w3.org/1999/xhtml',
    childNodes: [],
    get textContent() {
      return standIn.text ?? ''
    },
    set textContent(value: string) {
      standIn.text = value
    },
  }
  if (svg) standIn.ownerSVGElement = null
  return standIn
}

/** Whether a position in the markup falls inside an `<svg>` element. */
function svgRanges(markup: string): (index: number) => boolean {
  const ranges: Array<[number, number]> = []
  const opening = /<svg[\s>]/gi
  let match: RegExpExecArray | null
  while ((match = opening.exec(markup))) {
    const close = markup.toLowerCase().indexOf('</svg>', match.index)
    ranges.push([match.index + 1, close === -1 ? markup.length : close])
  }
  return (index) => ranges.some(([from, to]) => index > from && index < to)
}

function kebab(property: string): string {
  const dashed = property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
  return /^(webkit|moz|ms)-/.test(dashed) ? `-${dashed}` : dashed
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;')
}
