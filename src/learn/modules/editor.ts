import type { TimelineDefinition } from '../../engine'
import type { CheckContext, Module } from '../types'
import { animates, custom, valueIs } from '../checks'

/**
 * Module 3: the visual editor. The work happens in the studio; each step ends with
 * **More → Copy JSON** and pasting it here, where the checks read it. It closes by
 * writing the same animation in code, to show both are the same data.
 */

const STYLE = `<style>
  .stage { height: 180px; display: flex; flex-direction: column; justify-content: center; gap: 16px; padding: 0 24px; }
  .box { width: 48px; height: 48px; border-radius: 10px; background: #4a9eff; }
  .box.placeholder { background: #8b5cf6; }
</style>`

const emptyStage = `${STYLE}<div class="stage"></div>`
const oneBox = `${STYLE}<div class="stage"><div class="box"></div></div>`

const PASTE_HERE = `play(
  // In the studio: More → Copy JSON. Paste it here, replacing this line.
)`

type KeyframedTrack = { property: string; target: string; keyframes: { time: number; value: unknown; easing?: unknown }[] }

/** Keyframe tracks for a property, across everything the pasted JSON built. */
function tracksFor(context: CheckContext, property: string): KeyframedTrack[] {
  return context.definitions.flatMap((definition) => definition.tracks).filter(
    (track): track is KeyframedTrack & TimelineDefinition['tracks'][number] => track.property === property && 'keyframes' in track
  )
}

const pasted = (): { label: string; test: (context: CheckContext) => true | string } => ({
  label: 'JSON from the studio is pasted in',
  test: (context) => context.definitions.length > 0 || 'Paste the JSON inside `play( … )`.',
})

/** What the studio exports for a rectangle moving 200px, with the easing and extra tracks a step adds. */
const exported = (tracks: object[]) =>
  `play(${JSON.stringify(
    {
      id: 'timeline-1',
      name: 'My animation',
      config: { duration: 2000 },
      tracks,
    },
    null,
    2
  )})`

const moveTrack = (easing?: string) => ({
  id: 'track-1',
  target: 'rect-1',
  property: 'x',
  keyframes: [
    { time: 0, value: 0 },
    { time: 2000, value: 200, ...(easing && { easing }) },
  ],
})

const fadeTrack = {
  id: 'track-2',
  target: 'rect-1',
  property: 'opacity',
  keyframes: [
    { time: 0, value: 0 },
    { time: 2000, value: 1 },
  ],
}

export const editorModule: Module = {
  id: 'editor',
  title: 'The editor',
  summary: 'Build animations visually in the studio, and see that what it saves is the same JSON you wrote by hand.',
  lessons: [
    {
      id: 'build-visually',
      title: 'Build it visually',
      summary: 'An element, a track and keyframes, made in the studio.',
      steps: [
        {
          id: 'first-track',
          title: 'An element and a track',
          body: `Open the **[studio](/studio)** in a new tab and start a **New** project.

1. In the **Elements** panel, add a **Rectangle**.
2. In the **Tracks** panel, click **+**, type the rectangle's name as the **Target** and \`x\` as the **Property**, then click **Add Track**. The track starts with two keyframes, at the start and the end of the scene.
3. Click the keyframe at the **end**, and set its value to \`200\` in the Property Panel.
4. Open **More → Copy JSON**.

**Then:** paste the JSON inside \`play( … )\` below. The preview plays it on a placeholder box.`,
          markup: emptyStage,
          starter: PASTE_HERE,
          solution: exported([moveTrack()]),
          checks: [
            pasted(),
            custom('A track animates `x`', (context) => tracksFor(context, 'x').length > 0 || 'No track animates `x` yet: add one with Property `x`.'),
            custom('It moves from 0 to 200', (context) => {
              const [track] = tracksFor(context, 'x')
              if (!track) return 'No track animates `x` yet.'
              const first = track.keyframes[0]?.value
              const last = track.keyframes[track.keyframes.length - 1]?.value
              return (first === 0 && last === 200) || `The keyframes go from ${first} to ${last}; set the last one to 200.`
            }),
          ],
          hints: ['The Target is the name shown for the rectangle in the Elements panel.', 'Select the end keyframe (the diamond at the right of the track) before typing the value.'],
        },
        {
          id: 'ease-keyframe',
          title: 'Ease the arrival',
          body: `In the studio, select the **end** keyframe again. In the Property Panel, set its **Easing** to \`ease-out\` — the motion starts fast and settles as it arrives.

Copy the JSON again and paste it below, replacing the old JSON. Notice the \`easing\` on the last keyframe: it is the same field you wrote in Foundations.`,
          markup: emptyStage,
          starter: exported([moveTrack()]),
          solution: exported([moveTrack('ease-out')]),
          checks: [
            pasted(),
            custom('The last `x` keyframe eases out', (context) => {
              const [track] = tracksFor(context, 'x')
              const easing = track?.keyframes[track.keyframes.length - 1]?.easing
              return (typeof easing === 'string' && easing.startsWith('ease-out')) || `The last keyframe's easing is ${JSON.stringify(easing ?? 'linear')}.`
            }),
          ],
          hints: ['Easing belongs to the keyframe you arrive at, so select the one at the end.'],
        },
        {
          id: 'fade-track',
          title: 'Fade it in too',
          body: `Add a second track to the same rectangle, with Property \`opacity\`. Set its **start** keyframe to \`0\` and its **end** keyframe to \`1\`, so the rectangle fades in while it moves.

Copy the JSON and paste it below.`,
          markup: emptyStage,
          starter: exported([moveTrack('ease-out')]),
          solution: exported([moveTrack('ease-out'), fadeTrack]),
          checks: [
            pasted(),
            custom('A track animates `opacity`', (context) => tracksFor(context, 'opacity').length > 0 || 'Add a track with Property `opacity`.'),
            custom('It fades from 0 to 1', (context) => {
              const [track] = tracksFor(context, 'opacity')
              if (!track) return 'Add a track with Property `opacity`.'
              const first = track.keyframes[0]?.value
              const last = track.keyframes[track.keyframes.length - 1]?.value
              return (first === 0 && last === 1) || `Opacity goes from ${first} to ${last}; make it 0 then 1.`
            }),
            custom('Both tracks move the same element', (context) => {
              const [move] = tracksFor(context, 'x')
              const [fade] = tracksFor(context, 'opacity')
              return (!!move && !!fade && move.target === fade.target) || 'Give the opacity track the same Target as the x track.'
            }),
          ],
          hints: ['New tracks start with keyframe values you can edit: select each diamond and type the value.'],
        },
      ],
    },
    {
      id: 'same-data',
      title: 'Same data, two ways',
      summary: 'A preset from the studio, and the same animation written in code.',
      steps: [
        {
          id: 'preset',
          title: 'Apply a preset',
          body: `Presets are ready-made tracks. In the studio, start a new project, add a Rectangle, select it, and in the **Presets** panel click **Fade In Up**.

Copy the JSON and paste it below: a preset is just a set of tracks.`,
          markup: emptyStage,
          starter: PASTE_HERE,
          solution: exported([
            { id: 'p-1', target: 'rect-1', property: 'opacity', keyframes: [{ time: 0, value: 0 }, { time: 600, value: 1, easing: 'ease-out' }] },
            { id: 'p-2', target: 'rect-1', property: 'y', keyframes: [{ time: 0, value: 30 }, { time: 600, value: 0, easing: 'ease-out' }] },
          ]),
          checks: [
            pasted(),
            custom('It fades in', (context) => {
              const [track] = tracksFor(context, 'opacity')
              if (!track) return 'No opacity track: apply **Fade In Up** to a selected element.'
              return (track.keyframes[0]?.value === 0 && track.keyframes[track.keyframes.length - 1]?.value === 1) || 'The opacity track should go from 0 to 1.'
            }),
            custom('It moves up into place', (context) => {
              const [track] = tracksFor(context, 'y')
              if (!track) return 'No y track: Fade In Up also moves the element.'
              const first = track.keyframes[0]?.value
              const last = track.keyframes[track.keyframes.length - 1]?.value
              return (typeof first === 'number' && typeof last === 'number' && first > last) || 'The y track should start lower (a larger y) and end in place.'
            }),
          ],
          hints: ['Select the element on the canvas first; presets apply to the selection.'],
        },
        {
          id: 'in-code',
          title: 'The same thing in code',
          body: `The GSAP-style API builds the same tracks. \`live.from()\` animates *from* the values you give to where the element already is:

\`\`\`js
live.from('.box', { opacity: 0, y: 30, duration: 0.6, ease: 'power2.out' })
\`\`\`

**Your turn:** write it for \`.box\`. Compare the preview with the preset — and the tracks with the JSON you pasted in the last step.`,
          markup: oneBox,
          starter: `// Fade .box in from opacity 0 while it rises from y: 30\n`,
          solution: `live.from('.box', { opacity: 0, y: 30, duration: 0.6, ease: 'power2.out' })`,
          checks: [
            animates('.box', 'opacity'),
            valueIs('.box', 'opacity', 0, 0),
            valueIs('.box', 'y', 30, 0),
            valueIs('.box', 'y', 0),
          ],
          hints: ["`live.from('.box', { opacity: 0, y: 30, duration: 0.6 })`"],
        },
      ],
    },
  ],
}
