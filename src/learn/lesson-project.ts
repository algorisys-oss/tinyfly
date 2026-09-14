import type { TimelineDefinition } from '../engine'
import type { SampleDefinition, SampleTrack } from '../editor/samples'

/**
 * "Open in editor" at the end of a module: the timelines a step played, as a studio
 * project. Each target becomes a box the size of the course's, stacked down the
 * canvas, and the tracks are copied as they are.
 *
 * Only JSON played with `play()` names its targets the way the studio does (by
 * `data-tinyfly` name); `live` code names elements by selector. So this returns
 * undefined unless every track targets a `data-tinyfly` element in the markup.
 */

const BOX = 60
const GAP = 30

export function lessonSample(
  title: string,
  definitions: TimelineDefinition[],
  elementNames: string[]
): SampleDefinition | undefined {
  const tracks = definitions.flatMap((definition) => definition.tracks)
  if (tracks.length === 0) return undefined

  const known = new Set(elementNames)
  const targets = [...new Set(tracks.flatMap((track) => [track.target, ...(track.targets ?? [])]))]
  if (!targets.every((target) => known.has(target))) return undefined

  const top = 60
  return {
    id: `lesson-${slug(title)}`,
    name: title,
    description: 'Opened from the tinyfly course',
    category: 'basic',
    thumbnail: '🎓',
    duration: Math.max(0, ...definitions.map((definition) => definition.config.duration ?? 0)),
    elements: targets.map((name, index) => ({
      type: 'rect',
      name,
      x: 80,
      y: top + index * (BOX + GAP),
      width: BOX,
      height: BOX,
      fill: '#4a9eff',
      borderRadius: 10,
    })),
    tracks: tracks.map(({ id: _id, ...track }) => track as SampleTrack),
  }
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
