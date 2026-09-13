import type { Module } from '../types'
import { animates, custom, durationIs, easeIs, staggerIs, timelineCount, valueIs } from '../checks'

/**
 * Module 2, the pilot: tinyfly's GSAP-style API, from one tween to a looping
 * timeline. Each step adds one idea to the code of the step before.
 */

const STAGE_STYLE = `<style>
  .stage { position: relative; height: 180px; display: flex; flex-direction: column; justify-content: center; gap: 14px; padding: 0 24px; }
  .box { width: 48px; height: 48px; border-radius: 10px; background: #c6ff3d; }
  .row { display: flex; gap: 14px; justify-content: center; }
  .dot { width: 26px; height: 26px; border-radius: 50%; background: #4a9eff; }
  .a, .b, .c { width: 40px; height: 40px; border-radius: 8px; }
  .a { background: #c6ff3d; } .b { background: #4a9eff; } .c { background: #ec4899; }
</style>`

const oneBox = `${STAGE_STYLE}<div class="stage"><div class="box"></div></div>`
const fiveDots = `${STAGE_STYLE}<div class="stage"><div class="row">${'<div class="dot"></div>'.repeat(5)}</div></div>`
const threeShapes = `${STAGE_STYLE}<div class="stage"><div class="a"></div><div class="b"></div><div class="c"></div></div>`

export const gsapApiModule: Module = {
  id: 'gsap-api',
  title: 'The GSAP-style API',
  summary: 'Tweens, many elements at once, and timelines: the code most tinyfly animation starts with.',
  lessons: [
    {
      id: 'first-tween',
      title: 'Your first tween',
      summary: 'Move an element, choose how long and how, and animate in from somewhere.',
      steps: [
        {
          id: 'move',
          title: 'Move a box',
          body: `A **tween** animates properties of an element from where they are to the values you give.

\`\`\`js
live.to(target, { property: value })
\`\`\`

The target is a CSS selector (or an element), and \`x\` and \`y\` move it in pixels.

**Your turn:** move \`.box\` 200px to the right.`,
          markup: oneBox,
          starter: `live.to('.box', {  })`,
          solution: `live.to('.box', { x: 200 })`,
          checks: [animates('.box', 'x'), valueIs('.box', 'x', 200)],
          hints: ['Put `x: 200` between the braces.'],
        },
        {
          id: 'duration-ease',
          title: 'How long, and how',
          body: `\`duration\` is in **seconds** (the default is 0.5). \`ease\` is how the motion speeds up and slows down: \`'power2.out'\` starts fast and settles gently, which suits things arriving on screen.

**Your turn:** make the move take \`1.5\` seconds with \`ease: 'power2.out'\`.`,
          markup: oneBox,
          starter: `live.to('.box', { x: 200 })`,
          solution: `live.to('.box', { x: 200, duration: 1.5, ease: 'power2.out' })`,
          checks: [valueIs('.box', 'x', 200), durationIs(1.5), easeIs('.box', 'x', 'power2.out')],
          hints: ['Add `duration: 1.5` and `ease: \'power2.out\'` to the same object as `x`.'],
        },
        {
          id: 'from',
          title: 'Animate in with from()',
          body: `\`live.from()\` is the reverse of \`to()\`: the values you give are where the element **starts**, and it animates to where it already is. It is the usual way to reveal something.

**Your turn:** fade \`.box\` in from \`opacity: 0\` while it rises from \`y: 40\`.`,
          markup: oneBox,
          starter: `live.to('.box', { opacity: 0, y: 40 })`,
          solution: `live.from('.box', { opacity: 0, y: 40 })`,
          checks: [valueIs('.box', 'opacity', 0, 0), valueIs('.box', 'y', 40, 0), valueIs('.box', 'opacity', 1), valueIs('.box', 'y', 0)],
          hints: ['Change `to` to `from`: the values stay, but they become the starting point.'],
        },
        {
          id: 'from-to',
          title: 'Both ends with fromTo()',
          body: `When you want to say exactly where a tween starts and ends, use \`fromTo(target, fromVars, toVars)\`. Timing and easing go in the second object.

**Your turn:** move \`.box\` from \`x: -100\` to \`x: 100\` over \`1\` second.`,
          markup: oneBox,
          starter: `live.fromTo('.box', {  }, {  })`,
          solution: `live.fromTo('.box', { x: -100 }, { x: 100, duration: 1 })`,
          checks: [valueIs('.box', 'x', -100, 0), valueIs('.box', 'x', 100), durationIs(1)],
          hints: ['The first object is the start: `{ x: -100 }`. The second is the end, with the timing: `{ x: 100, duration: 1 }`.'],
        },
      ],
    },
    {
      id: 'many-elements',
      title: 'Many elements',
      summary: 'Animate everything a selector matches, one after another.',
      steps: [
        {
          id: 'selector',
          title: 'Every match moves',
          body: `A selector that matches several elements animates **all** of them with one call.

**Your turn:** lift every \`.dot\` to \`y: -40\`.`,
          markup: fiveDots,
          starter: `// Every .dot, in one call\n`,
          solution: `live.to('.dot', { y: -40 })`,
          checks: [valueIs('.dot:nth-child(1)', 'y', -40), valueIs('.dot:nth-child(5)', 'y', -40)],
          hints: ["`live.to('.dot', { y: -40 })`"],
        },
        {
          id: 'stagger',
          title: 'One after another',
          body: `\`stagger\` starts each element a little after the one before, in document order. The number is the gap in seconds.

**Your turn:** stagger the dots \`0.1\`s apart.`,
          markup: fiveDots,
          starter: `live.to('.dot', { y: -40 })`,
          solution: `live.to('.dot', { y: -40, stagger: 0.1 })`,
          checks: [
            valueIs('.dot:nth-child(5)', 'y', -40),
            staggerIs('.dot', 'y', 0.1),
            custom('The last dot starts after the first has finished moving', (context) => {
              const last = context.valueAt('.dot:nth-child(5)', 'y', 0.4)
              return (typeof last === 'number' && last > -1) || 'The last dot should still be at rest 0.4s in.'
            }),
          ],
          hints: ['Add `stagger: 0.1` next to `y`.'],
        },
        {
          id: 'stagger-from',
          title: 'Stagger from the centre',
          body: `\`stagger\` can be an object: \`each\` is the gap, and \`from\` says where the ripple begins, \`'start'\`, \`'end'\`, \`'center'\` or \`'edges'\`.

**Your turn:** start the ripple from the centre dot, \`0.1\`s apart.`,
          markup: fiveDots,
          starter: `live.to('.dot', { y: -40, stagger: 0.1 })`,
          solution: `live.to('.dot', { y: -40, stagger: { each: 0.1, from: 'center' } })`,
          checks: [
            staggerIs('.dot', 'y', 0.1, 'center'),
            custom('The middle dot moves first', (context) => {
              const middle = context.valueAt('.dot:nth-child(3)', 'y', 0.25)
              const edge = context.valueAt('.dot:nth-child(1)', 'y', 0.25)
              return (typeof middle === 'number' && typeof edge === 'number' && middle < edge) || 'At 0.25s the middle dot should be higher than the first.'
            }),
          ],
          hints: ["`stagger: { each: 0.1, from: 'center' }`"],
        },
      ],
    },
    {
      id: 'timelines',
      title: 'Timelines',
      summary: 'Sequence tweens, overlap them, and loop the whole thing.',
      steps: [
        {
          id: 'sequence',
          title: 'One after another',
          body: `A **timeline** plays tweens in order. Each \`.to()\` you chain starts when the previous one ends.

\`\`\`js
live.timeline()
  .to(first, { ... })
  .to(second, { ... })
\`\`\`

**Your turn:** in one timeline, move \`.a\` then \`.b\` to \`x: 150\`, each over \`0.5\`s.`,
          markup: threeShapes,
          starter: `live.timeline()\n  .to('.a', { x: 150, duration: 0.5 })\n`,
          solution: `live.timeline()\n  .to('.a', { x: 150, duration: 0.5 })\n  .to('.b', { x: 150, duration: 0.5 })`,
          checks: [
            timelineCount(1),
            valueIs('.a', 'x', 150, 0.5),
            valueIs('.b', 'x', 0, 0.5),
            valueIs('.b', 'x', 150, 1),
          ],
          hints: ["Chain another `.to('.b', { x: 150, duration: 0.5 })` after the first."],
        },
        {
          id: 'position',
          title: 'Overlap with the position parameter',
          body: `A third argument says **where** in the timeline a tween goes. \`'<'\` means "with the previous tween", \`'-=0.2'\` "0.2s before the end so far", and a number is a time in seconds.

**Your turn:** add \`.c\` moving to \`x: 150\` over \`0.5\`s, starting together with \`.b\`.`,
          markup: threeShapes,
          starter: `live.timeline()\n  .to('.a', { x: 150, duration: 0.5 })\n  .to('.b', { x: 150, duration: 0.5 })\n`,
          solution: `live.timeline()\n  .to('.a', { x: 150, duration: 0.5 })\n  .to('.b', { x: 150, duration: 0.5 })\n  .to('.c', { x: 150, duration: 0.5 }, '<')`,
          checks: [
            valueIs('.c', 'x', 0, 0.5),
            custom('`.c` moves at the same time as `.b`', (context) => {
              const b = context.valueAt('.b', 'x', 0.75)
              const c = context.valueAt('.c', 'x', 0.75)
              return (typeof b === 'number' && typeof c === 'number' && Math.abs(b - c) < 1 && c > 0) || 'Halfway through `.b`, `.c` should be exactly as far along.'
            }),
            durationIs(1),
          ],
          hints: ["Pass `'<'` as the third argument: `.to('.c', { x: 150, duration: 0.5 }, '<')`."],
        },
        {
          id: 'repeat-yoyo',
          title: 'Loop it back and forth',
          body: `Options on the timeline apply to the whole sequence. \`repeat: -1\` loops forever, and \`yoyo: true\` plays every other loop backwards, so it glides back instead of jumping.

**Your turn:** make the timeline repeat forever with yoyo.`,
          markup: threeShapes,
          starter: `live.timeline()\n  .to('.a', { x: 150, duration: 0.5 })\n  .to('.b', { x: 150, duration: 0.5 })\n  .to('.c', { x: 150, duration: 0.5 }, '<')`,
          solution: `live.timeline({ repeat: -1, yoyo: true })\n  .to('.a', { x: 150, duration: 0.5 })\n  .to('.b', { x: 150, duration: 0.5 })\n  .to('.c', { x: 150, duration: 0.5 }, '<')`,
          checks: [
            custom('Repeats forever', (context) => context.definitions[0]?.config.loop === -1 || 'Add `repeat: -1` to the timeline options.'),
            custom('Plays back and forth', (context) => context.definitions[0]?.config.alternate === true || 'Add `yoyo: true` to the timeline options.'),
            valueIs('.c', 'x', 150, 1),
          ],
          hints: ['Pass the options to `live.timeline({ repeat: -1, yoyo: true })`.'],
        },
      ],
    },
  ],
}
