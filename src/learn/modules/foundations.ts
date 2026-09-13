import type { Module } from '../types'
import { animates, custom, durationIs, valueIs } from '../checks'

/**
 * Module 1: what an animation is in tinyfly — a timeline written as data. The
 * learner edits JSON and calls `play(animation)`; the GSAP-style API in the next
 * module compiles to exactly this.
 */

const STYLE = `<style>
  .stage { height: 180px; display: flex; flex-direction: column; justify-content: center; gap: 16px; padding: 0 24px; }
  .box { width: 48px; height: 48px; border-radius: 10px; background: #4a9eff; }
</style>`

const oneBox = `${STYLE}<div class="stage"><div class="box" data-tinyfly="box"></div></div>`

const track = (keyframes: string, extra = '') => `    {
      id: 'move',
      target: 'box',
      property: 'x',${extra}
      keyframes: [
${keyframes}
      ],
    },`

const animation = (tracks: string, config = `{ duration: 1000 }`) => `const animation = {
  id: 'hello',
  config: ${config},
  tracks: [
${tracks}
  ],
}

play(animation)`

/** The keyframe list of the one `x` track on the box. */
const keyframesOf = (context: Parameters<Parameters<typeof custom>[1]>[0]) => {
  const [first] = context.tracks('.box', 'x')
  return first && 'keyframes' in first ? first.keyframes : []
}

export const foundationsModule: Module = {
  id: 'foundations',
  title: 'Foundations: animation as data',
  summary: 'Timelines, tracks and keyframes as plain JSON — what every tinyfly animation is underneath.',
  lessons: [
    {
      id: 'keyframes',
      title: 'Keyframes',
      summary: 'A timeline is JSON: tracks of keyframes, in milliseconds.',
      steps: [
        {
          id: 'first-keyframes',
          title: 'An animation is JSON',
          body: `In tinyfly an animation is **data**. A timeline has **tracks**; a track animates one \`property\` of one \`target\`; and its **keyframes** say what the value is at each \`time\`. Between keyframes, the value is worked out for you.

Here the box is named \`box\` (its \`data-tinyfly\` attribute), and \`play(animation)\` plays the JSON in the preview.

**Your turn:** add a second keyframe so the box reaches \`x: 200\` at \`time: 1000\`.`,
          markup: oneBox,
          starter: animation(track(`        { time: 0, value: 0 },\n        // a keyframe at 1000ms with value 200`)),
          solution: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200 },`)),
          checks: [
            animates('.box', 'x'),
            custom('The track has two keyframes', (context) => keyframesOf(context).length === 2 || `The track has ${keyframesOf(context).length} keyframe(s).`),
            valueIs('.box', 'x', 200, 1),
            valueIs('.box', 'x', 100, 0.5),
          ],
          hints: ['Replace the comment with `{ time: 1000, value: 200 },`.'],
        },
        {
          id: 'milliseconds',
          title: 'Times are milliseconds',
          body: `Timeline times are **milliseconds** (the GSAP-style API uses seconds, as GSAP does, and converts). The timeline's \`config.duration\` is how long it runs.

**Your turn:** slow it down to two seconds — the box should reach \`x: 200\` at \`2000\`ms, and the timeline should last \`2000\`ms.`,
          markup: oneBox,
          starter: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200 },`)),
          solution: animation(track(`        { time: 0, value: 0 },\n        { time: 2000, value: 200 },`), `{ duration: 2000 }`),
          checks: [durationIs(2), valueIs('.box', 'x', 100, 1), valueIs('.box', 'x', 200, 2)],
          hints: ['Two changes: the last keyframe\'s `time`, and `config: { duration: 2000 }`.'],
        },
        {
          id: 'there-and-back',
          title: 'More keyframes',
          body: `A track can have as many keyframes as you like, in time order. The value passes through each one.

**Your turn:** make the box go out to \`x: 200\` at \`1000\`ms and come back to \`0\` at \`2000\`ms.`,
          markup: oneBox,
          starter: animation(track(`        { time: 0, value: 0 },\n        { time: 2000, value: 200 },`), `{ duration: 2000 }`),
          solution: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200 },\n        { time: 2000, value: 0 },`), `{ duration: 2000 }`),
          checks: [valueIs('.box', 'x', 200, 1), valueIs('.box', 'x', 0, 2), valueIs('.box', 'x', 100, 1.5)],
          hints: ['Three keyframes: `{ time: 0, value: 0 }`, `{ time: 1000, value: 200 }`, `{ time: 2000, value: 0 }`.'],
        },
      ],
    },
    {
      id: 'tracks',
      title: 'Tracks and values',
      summary: 'Animate several properties at once, and values that are not numbers.',
      steps: [
        {
          id: 'second-track',
          title: 'One track per property',
          body: `Each track animates **one** property. To move and turn at the same time, add a second track — they all play together on the same clock.

**Your turn:** add a track with \`id: 'turn'\` that animates \`rotate\` on \`box\` from \`0\` to \`180\` over \`1000\`ms.`,
          markup: oneBox,
          starter: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200 },`)),
          solution: animation(
            `${track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200 },`)}
    {
      id: 'turn',
      target: 'box',
      property: 'rotate',
      keyframes: [
        { time: 0, value: 0 },
        { time: 1000, value: 180 },
      ],
    },`
          ),
          checks: [animates('.box', 'rotate'), valueIs('.box', 'rotate', 180, 1), valueIs('.box', 'x', 200, 1)],
          hints: ['Copy the `move` track, then change its `id`, `property` and the last value.'],
        },
        {
          id: 'colours',
          title: 'Colours are values too',
          body: `Keyframe values can be numbers, **colours** (\`'#4a9eff'\`, \`'rgb(…)'\`), arrays, and even SVG path data. tinyfly blends between them.

**Your turn:** change the \`move\` track to animate \`backgroundColor\` from \`'#4a9eff'\` to \`'#ec4899'\`.`,
          markup: oneBox,
          starter: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200 },`)),
          solution: animation(`    {
      id: 'move',
      target: 'box',
      property: 'backgroundColor',
      keyframes: [
        { time: 0, value: '#4a9eff' },
        { time: 1000, value: '#ec4899' },
      ],
    },`),
          checks: [
            animates('.box', 'backgroundColor'),
            custom('It starts blue and ends pink', (context) => {
              const start = String(context.valueAt('.box', 'backgroundColor', 0)).toLowerCase()
              const end = String(context.valueAt('.box', 'backgroundColor', 1)).toLowerCase()
              return (start.includes('4a9eff') || start.includes('74, 158, 255')) && (end.includes('ec4899') || end.includes('236, 72, 153')) || `It goes from ${start} to ${end}.`
            }),
            custom('Half-way, the colour is in between', (context) => {
              const middle = String(context.valueAt('.box', 'backgroundColor', 0.5)).toLowerCase()
              return (!middle.includes('4a9eff') && !middle.includes('ec4899') && middle !== 'undefined') || 'The colour should be blending half-way through.'
            }),
          ],
          hints: ["Set `property: 'backgroundColor'` and use colour strings for both `value`s."],
        },
      ],
    },
    {
      id: 'easing',
      title: 'Easing and loops',
      summary: 'Shape the motion between keyframes, and repeat it.',
      steps: [
        {
          id: 'ease-out',
          title: 'Easing belongs to a keyframe',
          body: `By default values change at a steady rate. An \`easing\` on a keyframe shapes the motion **arriving** at that keyframe: \`'ease-out'\` starts fast and settles, \`'ease-in'\` builds up, \`'ease-in-out'\` does both.

**Your turn:** give the \`1000\`ms keyframe \`easing: 'ease-out'\`.`,
          markup: oneBox,
          starter: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200 },`)),
          solution: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200, easing: 'ease-out' },`)),
          checks: [
            valueIs('.box', 'x', 200, 1),
            custom('It covers most of the distance early', (context) => {
              const half = context.valueAt('.box', 'x', 0.5)
              return (typeof half === 'number' && half > 140) || `Half-way it is at ${typeof half === 'number' ? Math.round(half) : half}; with ease-out it should be well past 100.`
            }),
          ],
          hints: ["Add `easing: 'ease-out'` inside the second keyframe's object."],
        },
        {
          id: 'cubic-bezier',
          title: 'Your own curve',
          body: `For an exact feel, use a cubic-bezier — the same four numbers CSS uses:

\`\`\`js
easing: { type: 'cubic-bezier', points: [0.7, 0, 0.3, 1] }
\`\`\`

This one starts slowly, rushes through the middle, and settles.

**Your turn:** use that curve on the \`1000\`ms keyframe.`,
          markup: oneBox,
          starter: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200, easing: 'ease-out' },`)),
          solution: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200, easing: { type: 'cubic-bezier', points: [0.7, 0, 0.3, 1] } },`)),
          checks: [
            custom('Slow at first', (context) => {
              const early = context.valueAt('.box', 'x', 0.25)
              return (typeof early === 'number' && early < 30) || 'A quarter of the way in it should still be near the start.'
            }),
            custom('Nearly there by three quarters', (context) => {
              const late = context.valueAt('.box', 'x', 0.75)
              return (typeof late === 'number' && late > 170) || 'Three quarters in it should be close to 200.'
            }),
            valueIs('.box', 'x', 200, 1),
          ],
          hints: ["Replace `'ease-out'` with `{ type: 'cubic-bezier', points: [0.7, 0, 0.3, 1] }`."],
        },
        {
          id: 'loop',
          title: 'Loop it',
          body: `Looping is data too: in \`config\`, \`loop: -1\` repeats forever (or a number of times), and \`alternate: true\` plays every other loop backwards.

**Your turn:** make the timeline loop forever, alternating.`,
          markup: oneBox,
          starter: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200, easing: 'ease-in-out' },`)),
          solution: animation(track(`        { time: 0, value: 0 },\n        { time: 1000, value: 200, easing: 'ease-in-out' },`), `{ duration: 1000, loop: -1, alternate: true }`),
          checks: [
            custom('Loops forever', (context) => context.definitions[0]?.config.loop === -1 || 'Add `loop: -1` to `config`.'),
            custom('Plays back and forth', (context) => context.definitions[0]?.config.alternate === true || 'Add `alternate: true` to `config`.'),
          ],
          hints: ['`config: { duration: 1000, loop: -1, alternate: true }`'],
        },
      ],
    },
  ],
}
