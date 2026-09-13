import type { Module } from '../types'
import { custom, durationIs, easeIs, sampleValues, valueIs } from '../checks'

/**
 * Module 4: motion craft. The API is familiar by now; these steps are about what
 * makes motion feel good — overlap, anticipation, follow-through, springs, and
 * durations that suit what is moving.
 */

const STYLE = `<style>
  .stage { height: 180px; display: flex; flex-direction: column; justify-content: center; gap: 12px; padding: 0 24px; }
  .card { width: 150px; height: 36px; border-radius: 8px; background: #1f2937; border-left: 4px solid #c6ff3d; }
  .box { width: 48px; height: 48px; border-radius: 12px; background: #c6ff3d; }
  .button { align-self: center; padding: 12px 22px; border-radius: 999px; background: #4a9eff; color: #fff; font: 600 14px system-ui; }
  .row { display: flex; gap: 10px; justify-content: center; }
  .tile { width: 34px; height: 34px; border-radius: 8px; background: #8b5cf6; }
</style>`

const cards = `${STYLE}<div class="stage"><div class="card a"></div><div class="card b"></div><div class="card c"></div></div>`
const box = `${STYLE}<div class="stage"><div class="box"></div></div>`
const button = `${STYLE}<div class="stage"><div class="button">Save</div></div>`
const tiles = `${STYLE}<div class="stage"><div class="row">${'<div class="tile"></div>'.repeat(8)}</div></div>`

const queued = `live.timeline()
  .from('.a', { x: -40, opacity: 0, duration: 0.5 })
  .from('.b', { x: -40, opacity: 0, duration: 0.5 })
  .from('.c', { x: -40, opacity: 0, duration: 0.5 })`

export const motionCraftModule: Module = {
  id: 'motion-craft',
  title: 'Motion craft',
  summary: 'Overlap, anticipation, follow-through, springs and durations: what makes motion feel right.',
  lessons: [
    {
      id: 'timing',
      title: 'Timing and overlap',
      summary: 'Let things overlap, and spread many small things over a fixed time.',
      steps: [
        {
          id: 'overlap',
          title: "Overlap, don't queue",
          body: `Motion that waits for each piece to finish feels mechanical. Starting the next piece **before** the previous one ends reads as one gesture.

The position parameter \`'-=0.3'\` starts a tween 0.3s before the timeline's end so far.

**Your turn:** make \`.b\` and \`.c\` each start \`0.3\`s before the previous card finishes.`,
          markup: cards,
          starter: queued,
          solution: `live.timeline()
  .from('.a', { x: -40, opacity: 0, duration: 0.5 })
  .from('.b', { x: -40, opacity: 0, duration: 0.5 }, '-=0.3')
  .from('.c', { x: -40, opacity: 0, duration: 0.5 }, '-=0.3')`,
          checks: [
            custom('`.b` starts while `.a` is still moving', (context) => {
              const b = context.valueAt('.b', 'opacity', 0.4)
              return (typeof b === 'number' && b > 0) || 'At 0.4s `.a` is still arriving, and `.b` should have started too.'
            }),
            durationIs(0.9),
            valueIs('.c', 'opacity', 1),
          ],
          hints: ["Pass `'-=0.3'` as the third argument to the second and third `.from()`."],
        },
        {
          id: 'amount',
          title: 'Spread by total time',
          body: `\`stagger: 0.1\` puts 0.1s between each element, so twice as many elements take twice as long. \`stagger: { amount: 0.4 }\` spreads them over **0.4s in total**, however many there are — the entrance keeps its pace when content changes.

**Your turn:** pop the tiles in with \`scale\` from \`0\`, spread over \`amount: 0.4\`.`,
          markup: tiles,
          starter: `live.from('.tile', { scale: 0, duration: 0.4, ease: 'back.out', stagger: 0.1 })`,
          solution: `live.from('.tile', { scale: 0, duration: 0.4, ease: 'back.out', stagger: { amount: 0.4 } })`,
          checks: [
            custom('Spread over 0.4s in total', (context) => {
              const [track] = context.tracks('.tile', 'scale')
              const stagger = track && 'stagger' in track ? track.stagger : undefined
              return (stagger?.amount !== undefined && Math.abs(stagger.amount - 400) < 1) || 'Use `stagger: { amount: 0.4 }`.'
            }),
            durationIs(0.8),
            valueIs('.tile:nth-child(8)', 'scale', 1),
          ],
          hints: ['Replace `stagger: 0.1` with `stagger: { amount: 0.4 }`.'],
        },
      ],
    },
    {
      id: 'anticipation',
      title: 'Anticipation and follow-through',
      summary: 'Wind up before a move, and let it overshoot and settle.',
      steps: [
        {
          id: 'wind-up',
          title: 'Wind up first',
          body: `A small move the **opposite** way before the real one — anticipation — tells the eye something is about to happen.

**Your turn:** in one timeline, pull \`.box\` back to \`x: -16\` over \`0.15\`s, then send it to \`x: 200\` over \`0.6\`s with \`ease: 'power3.out'\`.`,
          markup: box,
          starter: `live.timeline()\n  .to('.box', { x: 200, duration: 0.6, ease: 'power3.out' })`,
          solution: `live.timeline()\n  .to('.box', { x: -16, duration: 0.15, ease: 'power2.out' })\n  .to('.box', { x: 200, duration: 0.6, ease: 'power3.out' })`,
          checks: [
            custom('It pulls back before moving right', (context) => {
              const early = Math.min(...sampleValues(context, '.box', 'x', 0, 0.2, 20))
              return early < -8 || 'In the first 0.2s the box should move left, to about `x: -16`.'
            }),
            valueIs('.box', 'x', 200),
            durationIs(0.75),
          ],
          hints: ["Put `.to('.box', { x: -16, duration: 0.15 })` before the move to 200."],
        },
        {
          id: 'overshoot',
          title: 'Overshoot and settle',
          body: `Real things don't stop dead. \`ease: 'back.out'\` runs a little **past** the target and comes back, which reads as weight and energy.

**Your turn:** use \`ease: 'back.out'\` on the move to \`x: 200\`.`,
          markup: box,
          starter: `live.to('.box', { x: 200, duration: 0.8, ease: 'power3.out' })`,
          solution: `live.to('.box', { x: 200, duration: 0.8, ease: 'back.out' })`,
          checks: [
            easeIs('.box', 'x', 'back.out'),
            custom('It goes past 200 before settling', (context) => {
              const peak = Math.max(...sampleValues(context, '.box', 'x', 0, 0.8))
              return peak > 205 || `It peaks at ${Math.round(peak)}; back.out should carry it past 200.`
            }),
            valueIs('.box', 'x', 200),
          ],
          hints: ["Change the ease to `'back.out'`."],
        },
      ],
    },
    {
      id: 'springs',
      title: 'Springs and durations',
      summary: 'Physics instead of curves, and how long things should take.',
      steps: [
        {
          id: 'spring',
          title: 'A spring instead of an ease',
          body: `A **spring** has no duration: it settles when physics says so. \`spring: 'bouncy'\` uses a preset; the move keeps its momentum if it is interrupted.

**Your turn:** move \`.box\` to \`x: 200\` with \`spring: 'bouncy'\` (and no ease).`,
          markup: box,
          starter: `live.to('.box', { x: 200, duration: 0.8, ease: 'back.out' })`,
          solution: `live.to('.box', { x: 200, spring: 'bouncy' })`,
          checks: [
            custom('It is a spring', (context) => {
              const [track] = context.tracks('.box', 'x')
              return (track && 'kind' in track && track.kind === 'spring') || 'Add `spring: \'bouncy\'`.'
            }),
            custom('It bounces past the target', (context) => {
              const peak = Math.max(...sampleValues(context, '.box', 'x', 0, context.duration()))
              return peak > 210 || 'A bouncy spring should overshoot 200.'
            }),
            valueIs('.box', 'x', 200),
          ],
          hints: ["`live.to('.box', { x: 200, spring: 'bouncy' })`"],
        },
        {
          id: 'no-wobble',
          title: 'Tune it: no wobble',
          body: `A spring's feel comes from **stiffness** (how hard it pulls) and **damping** (how much it resists). With enough damping it arrives without overshooting — right for things that should feel precise, like a panel sliding into place.

**Your turn:** use \`spring: { stiffness: 200, damping: 30 }\` so the box arrives without passing 200.`,
          markup: box,
          starter: `live.to('.box', { x: 200, spring: 'bouncy' })`,
          solution: `live.to('.box', { x: 200, spring: { stiffness: 200, damping: 30 } })`,
          checks: [
            custom('Stiffness 200, damping 30', (context) => {
              const [track] = context.tracks('.box', 'x')
              const spring = track && 'spring' in track ? track.spring : undefined
              return (spring?.stiffness === 200 && spring?.damping === 30) || 'Set `spring: { stiffness: 200, damping: 30 }`.'
            }),
            custom('It never passes 200', (context) => {
              const peak = Math.max(...sampleValues(context, '.box', 'x', 0, context.duration()))
              return peak <= 200.5 || `It still overshoots to ${Math.round(peak)}.`
            }),
            valueIs('.box', 'x', 200),
          ],
          hints: ['Replace the preset name with an object: `{ stiffness: 200, damping: 30 }`.'],
        },
        {
          id: 'durations',
          title: 'Small things move fast',
          body: `Duration should suit **size and distance**. A button responding to a press wants roughly 0.1–0.3s; anything longer feels sluggish. Big, far moves (a page, a hero image) can take 0.6s or more.

**Your turn:** make the button press (a squeeze to \`scale: 0.92\` and back) take \`0.2\`s in total, using \`yoyo\`.`,
          markup: button,
          starter: `live.to('.button', { scale: 0.92, duration: 0.8, repeat: 1, yoyo: true })`,
          solution: `live.to('.button', { scale: 0.92, duration: 0.1, repeat: 1, yoyo: true, ease: 'power2.out' })`,
          checks: [
            custom('The whole press takes 0.2s', (context) => {
              const total = context.duration()
              return Math.abs(total - 0.2) < 0.01 || `The press takes ${Math.round(total * 100) / 100}s; each half should be 0.1s.`
            }),
            valueIs('.button', 'scale', 0.92, 0.1),
          ],
          hints: ['With `repeat: 1` and `yoyo`, the total is twice the duration: use `duration: 0.1`.'],
        },
      ],
    },
  ],
}
